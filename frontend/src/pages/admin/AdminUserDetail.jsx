import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import styles from './Admin.module.css'

export default function AdminUserDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = () => api.get(`/admin/users/${id}`).then(r => setData(r.data)).finally(() => setLoading(false))
  useEffect(() => { fetch() }, [id])

  const verify = async (status) => {
    await api.put(`/admin/users/${id}/verify`, { verificationStatus: status })
    toast.success(`User ${status} ✅`)
    fetch()
  }
  const toggle = async () => {
    const res = await api.put(`/admin/users/${id}/toggle`)
    toast.success(res.data.message)
    fetch()
  }

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner spinner-lg" /></div>
  if (!data) return null

  const { user, vehicles, rides, payments } = data
  const verPill = { pending: 'amber', approved: 'green', rejected: 'red' }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/admin/users" style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>← Back to Users</Link>
        </div>
        <h1 className="section-title">{user.name}</h1>

        <div className={styles.detailLayout}>
          {/* Sidebar */}
          <div className={styles.detailSidebar}>
            {/* Profile card */}
            <div className={`card ${styles.detailCard}`}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div className="avatar" style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#00e5ff44,#7c4dff22)', fontSize: '2rem', margin: '0 auto 14px' }}>{user.name?.[0]}</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>{user.name}</h3>
                <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: 4 }}>{user.email}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                  <span className="pill pill-purple" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{user.role}</span>
                  <span className={`pill pill-${verPill[user.verificationStatus]}`} style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{user.verificationStatus}</span>
                  <span className={`pill ${user.isActive ? 'pill-green' : 'pill-red'}`} style={{ fontSize: '0.72rem' }}>{user.isActive ? 'Active' : 'Disabled'}</span>
                </div>
              </div>

              {[
                { label: 'Phone', val: user.phone },
                { label: 'Gender', val: user.gender },
                { label: 'City', val: user.city || '—' },
                { label: 'State', val: user.state || '—' },
                { label: 'Address', val: user.address || '—' },
                { label: 'Joined', val: new Date(user.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) },
                { label: 'Last Seen', val: new Date(user.lastSeen).toLocaleString('en-IN') },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--card-border)', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text2)' }}>{f.label}</span>
                  <span style={{ fontWeight: 500 }}>{f.val}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className={`card ${styles.detailCard}`}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Stats</div>
              {[
                { l: 'Total Rides', v: user.totalRides, c: 'var(--cyan)' },
                { l: 'Total Savings', v: `₹${user.totalSavings}`, c: 'var(--green)' },
                { l: 'Rating', v: `⭐ ${user.rating?.toFixed(1)} (${user.ratingCount} reviews)`, c: 'var(--amber)' },
                { l: 'CO₂ Saved', v: `${(user.co2Saved||0).toFixed(1)} kg`, c: '#69f0ae' },
                { l: 'Wallet Balance', v: `₹${user.walletBalance}`, c: 'var(--purple)' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text2)' }}>{s.l}</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: s.c }}>{s.v}</span>
                </div>
              ))}
            </div>

            {/* Gov ID */}
            {user.govIdType && (
              <div className={`card ${styles.detailCard}`}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Identity Documents</div>
                <div style={{ fontSize: '0.84rem', marginBottom: 10 }}>
                  <span style={{ color: 'var(--text2)' }}>ID Type: </span>
                  <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{user.govIdType}</span>
                </div>
                {user.govIdImage && <img src={user.govIdImage} alt="Gov ID" style={{ width: '100%', borderRadius: 8, marginBottom: 10, border: '1px solid var(--card-border)' }} />}
                {user.selfieImage && <img src={user.selfieImage} alt="Selfie" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--card-border)' }} />}
              </div>
            )}

            {/* Emergency contact */}
            {user.emergencyContact?.name && (
              <div className={`card ${styles.detailCard}`}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12 }}>Emergency Contact</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                  <div>{user.emergencyContact.name} ({user.emergencyContact.relation})</div>
                  <div style={{ marginTop: 4, fontFamily: 'monospace' }}>{user.emergencyContact.phone}</div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className={`card ${styles.detailCard}`}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Admin Actions</div>
              <div className={styles.verifyActions}>
                {user.verificationStatus !== 'approved' && <button className="btn btn-sm" style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.2)' }} onClick={() => verify('approved')}>✅ Approve</button>}
                {user.verificationStatus !== 'rejected' && <button className="btn btn-sm btn-danger" onClick={() => verify('rejected')}>❌ Reject</button>}
                <button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-secondary'}`} onClick={toggle}>{user.isActive ? '🚫 Disable' : '✅ Enable'} Account</button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Vehicles */}
            <div className="card" style={{ padding: 24, background: 'var(--bg2)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Vehicles ({vehicles.length})</div>
              {vehicles.length === 0
                ? <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>No vehicles registered</div>
                : vehicles.map(v => (
                  <div key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🚗</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{v.brand} {v.model} · {v.plateNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 2 }}>{v.year} · {v.color} · {v.fuelType} · {v.capacity} seats</div>
                    </div>
                    <span className={`pill pill-${v.verificationStatus === 'approved' ? 'green' : v.verificationStatus === 'rejected' ? 'red' : 'amber'}`} style={{ fontSize: '0.7rem' }}>{v.verificationStatus}</span>
                    {v.verificationStatus === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.2)' }} onClick={async () => { await api.put(`/admin/vehicles/${v._id}/verify`, { verificationStatus: 'approved' }); toast.success('Vehicle approved'); fetch() }}>✓</button>
                        <button className="btn btn-sm btn-danger" onClick={async () => { await api.put(`/admin/vehicles/${v._id}/verify`, { verificationStatus: 'rejected' }); toast.success('Vehicle rejected'); fetch() }}>✗</button>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>

            {/* Rides */}
            <div className="card" style={{ padding: 24, background: 'var(--bg2)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Rides ({rides.length})</div>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>From</th><th>To</th><th>Role</th><th>Date</th><th>Fare</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map(r => (
                      <tr key={r._id}>
                        <td style={{ fontSize: '0.82rem' }}>{r.origin?.city}</td>
                        <td style={{ fontSize: '0.82rem' }}>{r.destination?.city}</td>
                        <td><span className="pill pill-purple" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{r.role}</span></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{new Date(r.departureTime).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)', fontSize: '0.88rem' }}>₹{r.farePerPerson}</td>
                        <td><span className={`pill pill-${r.status === 'completed' ? 'green' : r.status === 'cancelled' ? 'red' : 'cyan'}`} style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{r.status.replace('_',' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments */}
            <div className="card" style={{ padding: 24, background: 'var(--bg2)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Payments ({payments.length})</div>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Razorpay ID</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)' }}>₹{p.amount}</td>
                        <td style={{ fontSize: '0.78rem' }}>{p.method}</td>
                        <td><span className={`pill pill-${p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'amber'}`} style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{p.status}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text2)' }}>{p.razorpayPaymentId || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
