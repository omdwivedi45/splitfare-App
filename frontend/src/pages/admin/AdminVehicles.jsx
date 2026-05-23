// AdminVehicles.jsx
import { useState, useEffect } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import styles from './Admin.module.css'

export function AdminVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [verStatus, setVerStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetch = () => {
    setLoading(true)
    api.get('/admin/vehicles', { params: { verificationStatus: verStatus, page, limit: 20 } })
      .then(r => { setVehicles(r.data.vehicles); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [verStatus, page])

  const verify = async (id, status) => {
    await api.put(`/admin/vehicles/${id}/verify`, { verificationStatus: status })
    toast.success(`Vehicle ${status}`)
    fetch()
  }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="section-tag">Admin</div>
          <h1 className="section-title">Vehicles <span style={{ color: 'var(--text2)', fontSize: '1.2rem' }}>({total})</span></h1>
        </div>

        <div className={styles.filterBar}>
          <select value={verStatus} onChange={e => setVerStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
        : <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Vehicle</th><th>Owner</th><th>Plate</th><th>Type</th><th>Capacity</th><th>Fuel</th><th>Registered</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{v.brand} {v.model}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text2)' }}>{v.year} · {v.color}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{v.owner?.name}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text2)', fontFamily: 'monospace' }}>{v.owner?.phone}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: 'var(--cyan)' }}>{v.plateNumber}</td>
                    <td><span className="pill pill-purple" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{v.type}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{v.capacity} seats</td>
                    <td style={{ fontSize: '0.82rem', textTransform: 'capitalize', color: 'var(--text2)' }}>{v.fuelType}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{new Date(v.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><span className={`pill pill-${v.verificationStatus === 'approved' ? 'green' : v.verificationStatus === 'rejected' ? 'red' : 'amber'}`} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{v.verificationStatus}</span></td>
                    <td>
                      {v.verificationStatus === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.2)' }} onClick={() => verify(v._id, 'approved')}>✓ Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => verify(v._id, 'rejected')}>✗ Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i+1).slice(0,10).map(p => (
            <button key={p} className={`btn btn-sm ${page===p?'btn-primary':'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// AdminRides.jsx
export function AdminRides() {
  const [rides, setRides] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/rides', { params: { status, page, limit: 20 } })
      .then(r => { setRides(r.data.rides); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }, [status, page])

  const statusPill = { posted: 'cyan', matched: 'amber', in_progress: 'green', completed: 'green', cancelled: 'red' }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}><div className="section-tag">Admin</div><h1 className="section-title">All Rides <span style={{ color: 'var(--text2)', fontSize: '1.2rem' }}>({total})</span></h1></div>
        <div className={styles.filterBar}>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            {['posted','matched','in_progress','completed','cancelled'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
        : <div className="table-wrap">
            <table>
              <thead><tr><th>Posted By</th><th>From</th><th>To</th><th>Role</th><th>Departure</th><th>Distance</th><th>Fare/person</th><th>Riders</th><th>Status</th></tr></thead>
              <tbody>
                {rides.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{r.postedBy?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text2)', fontFamily: 'monospace' }}>{r.postedBy?.phone}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{r.origin?.city}<div style={{ fontSize: '0.7rem', color: 'var(--text2)' }}>{r.origin?.address?.slice(0,25)}...</div></td>
                    <td style={{ fontSize: '0.82rem' }}>{r.destination?.city}<div style={{ fontSize: '0.7rem', color: 'var(--text2)' }}>{r.destination?.address?.slice(0,25)}...</div></td>
                    <td><span className="pill pill-purple" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{r.role}</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{new Date(r.departureTime).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                    <td style={{ fontSize: '0.85rem' }}>{r.estimatedDistance} km</td>
                    <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)' }}>₹{r.farePerPerson}</td>
                    <td style={{ fontSize: '0.85rem' }}>{r.seatsBooked}/{r.seatsAvailable}</td>
                    <td><span className={`pill pill-${statusPill[r.status]}`} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{r.status.replace('_',' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i+1).slice(0,10).map(p => (
            <button key={p} className={`btn btn-sm ${page===p?'btn-primary':'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// AdminPayments.jsx
export function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/payments', { params: { status, page, limit: 20 } })
      .then(r => { setPayments(r.data.payments); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }, [status, page])

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s,p) => s + p.amount, 0)

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="flex-between" style={{ marginBottom: 28 }}>
          <div><div className="section-tag">Admin</div><h1 className="section-title">All Payments</h1></div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: 'var(--green)' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Total Collected (this page)</div>
          </div>
        </div>
        <div className={styles.filterBar}>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            {['created','paid','failed','refunded'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
        </div>
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
        : <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Payer</th><th>Receiver</th><th>Route</th><th>Amount</th><th>Method</th><th>Status</th><th>UPI Ref / UTR</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{p.payer?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text2)', fontFamily: 'monospace' }}>{p.payer?.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{p.receiver?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text2)', fontFamily: 'monospace' }}>{p.receiver?.phone}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{p.ride?.origin?.city} → {p.ride?.destination?.city}</td>
                    <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)', fontSize: '1rem' }}>₹{p.amount}</td>
                    <td><span className="pill pill-purple" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{p.method}</span></td>
                    <td><span className={`pill pill-${p.status==='paid'?'green':p.status==='failed'?'red':'amber'}`} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{p.status}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text2)' }}>{p.upiTxnId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i+1).slice(0,10).map(p => (
            <button key={p} className={`btn btn-sm ${page===p?'btn-primary':'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminVehicles
