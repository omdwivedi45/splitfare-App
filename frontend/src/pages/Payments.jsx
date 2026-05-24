import { useState, useEffect } from 'react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import styles from './Payments.module.css'

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activePayment, setActivePayment] = useState(null) // upi details
  const [utrCode, setUtrCode] = useState('')
  const [confirmingId, setConfirmingId] = useState('')

  const fetchPayments = () => {
    setLoading(true)
    api.get('/payments/my')
      .then(r => setPayments(r.data.payments))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const statusColor = { 
    created: 'amber', 
    pending_confirmation: 'amber', 
    paid: 'green', 
    failed: 'red', 
    refunded: 'purple' 
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('UPI ID copied to clipboard! 📋')
  }

  const initiatePayment = async (rideId) => {
    try {
      const res = await api.post('/payments/initiate', { rideId })
      setActivePayment(res.data)
      setUtrCode(res.data.upiTxnId || '')
      setModalOpen(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
    }
  }

  const submitUpiReference = async (e) => {
    e.preventDefault()
    if (!/^\d{12}$/.test(utrCode)) {
      return toast.error('UPI reference code (UTR) must be exactly 12 digits.')
    }
    try {
      await api.post('/payments/submit-reference', {
        paymentId: activePayment.paymentId,
        upiTxnId: utrCode
      })
      toast.success('UTR submitted successfully! Pending driver confirmation.')
      setModalOpen(false)
      fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification submit failed')
    }
  }

  const confirmReceipt = async (paymentId) => {
    setConfirmingId(paymentId)
    try {
      await api.post(`/payments/confirm/${paymentId}`)
      toast.success('Payment marked as paid! Savings rewarded. 🎉')
      fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed')
    } finally {
      setConfirmingId('')
    }
  }

  // Filter incoming claims (payments current user received but needs to confirm)
  const incomingClaims = payments.filter(p => 
    p.receiver?._id === user?._id && 
    p.status === 'pending_confirmation'
  )

  const totalPaid = payments.filter(p => p.status === 'paid' && p.payer?._id === user?._id).reduce((s, p) => s + p.amount, 0)
  const totalReceived = payments.filter(p => p.status === 'paid' && p.receiver?._id === user?._id).reduce((s, p) => s + p.amount, 0)

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="section-tag">Payments</div>
        <h1 className="section-title">Transaction History</h1>

        <div className={`grid-3 ${styles.kpiRow}`}>
          {[
            { label: 'Total Paid', val: `₹${totalPaid}`, icon: '💸', color: 'var(--cyan)' },
            { label: 'Total Received', val: `₹${totalReceived}`, icon: '💰', color: 'var(--green)' },
            { label: 'Transactions', val: payments.length, icon: '📋', color: 'var(--amber)' },
          ].map((k, i) => (
            <div key={i} className={`card ${styles.kpi}`}>
              <div className={styles.kpiIcon}>{k.icon}</div>
              <div style={{ color: k.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>{k.val}</div>
              <div style={{ color: 'var(--text2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Pending Approvals Section for Drivers */}
        {incomingClaims.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: 16, color: 'var(--amber)' }}>
              ⚠️ Incoming UPI Confirmations ({incomingClaims.length})
            </h2>
            <div className="grid-2">
              {incomingClaims.map(p => (
                <div key={p._id} className="card" style={{ padding: 20, border: '1px solid rgba(255,179,0,0.2)', background: 'rgba(255,179,0,0.02)' }}>
                  <div className="flex-between">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>
                      Ride: {p.ride?.origin?.city} → {p.ride?.destination?.city}
                    </span>
                    <span className="pill pill-amber" style={{ fontSize: '0.68rem' }}>Needs Action</span>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar" style={{ width: 36, height: 36, background: 'var(--cyan)' }}>{p.payer?.name?.[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.payer?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>UTR Ref: <span style={{ fontFamily: 'monospace', color: 'var(--cyan)', fontWeight: 600 }}>{p.upiTxnId}</span></div>
                    </div>
                  </div>
                  <div className="flex-between" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--green)' }}>
                      ₹{p.amount}
                    </span>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => confirmReceipt(p._id)} 
                      disabled={confirmingId === p._id}
                      style={{ background: 'var(--green)', color: '#000' }}
                    >
                      {confirmingId === p._id ? 'Verifying...' : '✓ Confirm Receipt'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading
          ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
          : payments.length === 0
          ? <div className="empty-state" style={{ marginTop: 60 }}><div className="empty-state-icon">💳</div><h3>No transactions yet</h3><p>Complete a ride to see your payment history here</p></div>
          : <div style={{ marginTop: 32 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>All Statements</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Route</th>
                      <th>Payer</th>
                      <th>Receiver</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id}>
                        <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td style={{ fontSize: '0.82rem' }}>{p.ride?.origin?.city || '—'} → {p.ride?.destination?.city || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar" style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#00e5ff44,#7c4dff22)', fontSize: '0.75rem' }}>{p.payer?.name?.[0]}</div>
                            <span style={{ fontSize: '0.85rem' }}>{p.payer?.name} {p.payer?._id === user?._id && '(You)'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar" style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#7c4dff44,#00e5ff22)', fontSize: '0.75rem' }}>{p.receiver?.name?.[0]}</div>
                            <span style={{ fontSize: '0.85rem' }}>{p.receiver?.name} {p.receiver?._id === user?._id && '(You)'}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)' }}>₹{p.amount}</td>
                        <td><span className="pill pill-purple" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{p.method}</span></td>
                        <td>
                          <span className={`pill pill-${statusColor[p.status]}`} style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                            {p.status.replace('_', ' ')}
                          </span>
                          {p.status === 'pending_confirmation' && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text2)', marginTop: 2, fontFamily: 'monospace' }}>UTR: {p.upiTxnId}</div>
                          )}
                        </td>
                        <td>
                          {p.status === 'created' && p.payer?._id === user?._id && (
                            <button className="btn btn-primary btn-sm" onClick={() => initiatePayment(p.ride?._id)}>Pay Now</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        }
      </div>

      {/* Direct UPI Payment Modal */}
      {modalOpen && activePayment && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 30 }}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="section-tag">Direct UPI Payment</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem' }}>Pay ₹{activePayment.amount}</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: 4 }}>To Driver: {activePayment.receiverName}</p>
            </div>

            {activePayment.receiverUpiId ? (
              <div className="flex-col flex-center" style={{ gap: 16 }}>
                {/* QR Code Container */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 16, display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(activePayment.upiLink)}`} 
                    alt="Scan to Pay via UPI" 
                    style={{ display: 'block', width: 180, height: 180 }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Scan QR with GPay, PhonePe, or Paytm</span>

                {/* Mobile Tap-to-Pay deep link */}
                <a 
                  href={activePayment.upiLink} 
                  className="btn btn-primary" 
                  style={{ width: '100%', borderRadius: 10, padding: 12, textDecoration: 'none', color: '#000' }}
                >
                  ⚡ Open UPI App to Pay
                </a>

                {/* Plain-text Copyable UPI ID (Fail-proof fallback) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--card-border)', marginTop: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--cyan)', fontWeight: 600 }}>{activePayment.receiverUpiId}</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(activePayment.receiverUpiId)} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 6 }}>📋 Copy ID</button>
                </div>
                
                <div className="divider" style={{ width: '100%', margin: '10px 0' }} />

                {/* Submission Form */}
                <form onSubmit={submitUpiReference} style={{ width: '100%' }}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Paste 12-Digit UPI Transaction ID (UTR)</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. 620894762109" 
                      value={utrCode} 
                      onChange={e => setUtrCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      required 
                      style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.1em', fontFamily: 'monospace' }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', borderRadius: 10, padding: 12 }}
                  >
                    Submit Proof of Payment
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
                <h4 style={{ color: 'var(--amber)', fontFamily: 'Syne, sans-serif' }}>Driver UPI Missing</h4>
                <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 8, lineHeight: 1.5 }}>
                  The driver has not added their UPI ID to their profile yet. Please ask the driver to update their profile or settle via Cash.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
