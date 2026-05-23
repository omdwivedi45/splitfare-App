// MyRides.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function MyRides() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : ''
    api.get(`/rides/my${params}`).then(r => setRides(r.data.rides)).finally(() => setLoading(false))
  }, [filter])

  const statuses = ['all','posted','matched','in_progress','completed','cancelled']
  const statusColor = { posted: 'cyan', matched: 'amber', in_progress: 'green', completed: 'green', cancelled: 'red' }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="flex-between" style={{ marginBottom: 28 }}>
          <div><div className="section-tag">History</div><h1 className="section-title">My Rides</h1></div>
          <Link to="/book" className="btn btn-primary">+ New Ride</Link>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {statuses.map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '50px', textTransform: 'capitalize' }} onClick={() => setFilter(s)}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>

        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
        : rides.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">🛣️</div><h3>No rides {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3></div>
        : rides.map(ride => (
          <Link key={ride._id} to={`/rides/${ride._id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '20px 24px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg2)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: ride.role === 'driver' ? 'rgba(0,229,255,0.1)' : 'rgba(124,77,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                {ride.role === 'driver' ? '🚗' : '🙋'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{ride.origin?.address?.slice(0,35)}... → {ride.destination?.address?.slice(0,30)}...</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>
                  {ride.role} · {new Date(ride.departureTime).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })} · {ride.estimatedDistance} km
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className={`pill pill-${statusColor[ride.status]}`} style={{ textTransform: 'capitalize' }}>{ride.status.replace('_',' ')}</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--cyan)' }}>₹{ride.farePerPerson}/person</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
