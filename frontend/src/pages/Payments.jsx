import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import styles from './Payments.module.css'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payments/my').then(r => setPayments(r.data.payments)).finally(() => setLoading(false))
  }, [])

  const statusColor = { created: 'amber', paid: 'green', failed: 'red', refunded: 'purple' }

  const initiatePayment = async (rideId) => {
    try {
      const res = await api.post('/payments/create-order', { rideId })
      const { orderId, amount, currency, paymentId, keyId } = res.data

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'SplitFare',
        description: 'Ride fare payment',
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId,
              rideId,
            })
            toast.success('Payment successful! 🎉')
            const updated = await api.get('/payments/my')
            setPayments(updated.data.payments)
          } catch { toast.error('Payment verification failed') }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#00e5ff' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
    }
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalReceived = payments.filter(p => p.status === 'paid' && p.receiver?._id).reduce((s, p) => s + p.amount, 0)

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

        {loading
          ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
          : payments.length === 0
          ? <div className="empty-state" style={{ marginTop: 60 }}><div className="empty-state-icon">💳</div><h3>No transactions yet</h3><p>Complete a ride to see your payment history here</p></div>
          : <div style={{ marginTop: 32 }}>
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
                            <span style={{ fontSize: '0.85rem' }}>{p.payer?.name}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar" style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#7c4dff44,#00e5ff22)', fontSize: '0.75rem' }}>{p.receiver?.name?.[0]}</div>
                            <span style={{ fontSize: '0.85rem' }}>{p.receiver?.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)' }}>₹{p.amount}</td>
                        <td><span className="pill pill-purple" style={{ fontSize: '0.72rem' }}>{p.method}</span></td>
                        <td><span className={`pill pill-${statusColor[p.status]}`} style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{p.status}</span></td>
                        <td>
                          {p.status === 'created' && (
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
    </div>
  )
}
