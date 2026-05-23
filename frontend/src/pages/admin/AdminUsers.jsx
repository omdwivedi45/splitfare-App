import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import styles from './Admin.module.css'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [verStatus, setVerStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetch = () => {
    setLoading(true)
    api.get('/admin/users', { params: { search, role, verificationStatus: verStatus, page, limit: 20 } })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t) }, [search, role, verStatus, page])

  const toggleUser = async (id) => {
    const res = await api.put(`/admin/users/${id}/toggle`)
    toast.success(res.data.message)
    fetch()
  }

  const verify = async (id, status) => {
    await api.put(`/admin/users/${id}/verify`, { verificationStatus: status })
    toast.success(`User ${status}`)
    fetch()
  }

  const statusPill = { pending: 'amber', approved: 'green', rejected: 'red' }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="flex-between" style={{ marginBottom: 28 }}>
          <div><div className="section-tag">Admin</div><h1 className="section-title">All Users <span style={{ color: 'var(--text2)', fontSize: '1.2rem' }}>({total})</span></h1></div>
        </div>

        <div className={styles.filterBar}>
          <input placeholder="🔍 Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="rider">Rider</option>
            <option value="driver">Driver</option>
            <option value="both">Both</option>
          </select>
          <select value={verStatus} onChange={e => setVerStatus(e.target.value)}>
            <option value="">All Verification</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading
          ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Role</th>
                    <th>Verification</th>
                    <th>Rides</th>
                    <th>Rating</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <Link to={`/admin/users/${u._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                          <div className="avatar" style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#00e5ff44,#7c4dff22)', fontSize: '0.9rem' }}>{u.name?.[0]}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--cyan)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text2)' }}>{u.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.phone}</td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.83rem' }}>{u.city || '—'}</td>
                      <td><span className="pill pill-purple" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{u.role}</span></td>
                      <td>
                        <span className={`pill pill-${statusPill[u.verificationStatus]}`} style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{u.verificationStatus}</span>
                      </td>
                      <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)' }}>{u.totalRides}</td>
                      <td>⭐ {u.rating?.toFixed(1)}</td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.78rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td><span className={`pill ${u.isActive ? 'pill-green' : 'pill-red'}`} style={{ fontSize: '0.68rem' }}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/admin/users/${u._id}`} className="btn btn-secondary btn-sm">View</Link>
                          {u.verificationStatus === 'pending' && (
                            <>
                              <button className="btn btn-sm" style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.2)' }} onClick={() => verify(u._id, 'approved')}>✓</button>
                              <button className="btn btn-sm" style={{ background: 'rgba(255,82,82,0.1)', color: 'var(--red)', border: '1px solid rgba(255,82,82,0.2)' }} onClick={() => verify(u._id, 'rejected')}>✗</button>
                            </>
                          )}
                          <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggleUser(u._id)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1).slice(0, 10).map(p => (
            <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
