import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rides/my?limit=5').then(r => setRides(r.data.rides)).finally(() => setLoading(false))
  }, [])

  const statusColor = { posted: 'cyan', matched: 'amber', in_progress: 'green', completed: 'green', cancelled: 'red' }
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* Hero greeting */}
        <div className={styles.greeting}>
          <div className={styles.greetOrb} />
          <div>
            <div className="section-tag">{greet()}</div>
            <h1 className="section-title">{user?.name?.split(' ')[0]} <span className="accent">→</span></h1>
            <p className="section-sub">Ready to split a ride today?</p>
          </div>
          <div className={styles.greetActions}>
            <Link to="/book" className="btn btn-primary btn-lg">+ Book a Ride</Link>
            <Link to="/matches" className="btn btn-secondary">View Matches</Link>
          </div>
        </div>

        {/* Stats */}
        <div className={`${styles.statsGrid} grid-4`} style={{ marginTop: 40 }}>
          {[
            { label: 'Total Rides', val: user?.totalRides || 0, icon: '🚘', color: 'var(--cyan)' },
            { label: 'Money Saved', val: `₹${user?.totalSavings || 0}`, icon: '💰', color: 'var(--green)' },
            { label: 'Your Rating', val: user?.rating?.toFixed(1) || '5.0', icon: '⭐', color: 'var(--amber)' },
            { label: 'CO₂ Saved', val: `${(user?.co2Saved || 0).toFixed(1)}kg`, icon: '🌿', color: '#69f0ae' },
          ].map((s, i) => (
            <div key={i} className={`card ${styles.statCard}`} style={{ animationDelay: `${i*0.08}s` }}>
              <div className={styles.statIcon}>{s.icon}</div>
              <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Verification banner */}
        {user?.verificationStatus === 'pending' && (
          <div className={styles.verifyBanner}>
            <span>⚠️ Your account verification is pending. </span>
            <Link to="/profile">Complete verification →</Link>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Quick Actions</h2>
          <div className="grid-3">
            {[
              { to: '/book', icon: '🔍', title: 'Find a Ride', desc: 'Search for rides matching your route' },
              { to: '/vehicles', icon: '🚗', title: 'Add Vehicle', desc: 'Register your vehicle to offer rides' },
              { to: '/matches', icon: '🤝', title: 'Live Matches', desc: 'See riders/drivers near your route right now' },
            ].map((a, i) => (
              <Link key={i} to={a.to} className={`card ${styles.actionCard}`} style={{ animationDelay: `${i*0.1}s` }}>
                <div className={styles.actionIcon}>{a.icon}</div>
                <div className={styles.actionTitle}>{a.title}</div>
                <div className={styles.actionDesc}>{a.desc}</div>
                <div className={styles.actionArrow}>→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent rides */}
        <div style={{ marginTop: 40 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Recent Rides</h2>
            <Link to="/rides" className="btn btn-secondary btn-sm">View all →</Link>
          </div>
          {loading ? <div className="flex-center" style={{ height: 120 }}><div className="spinner" /></div>
          : rides.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">🛣️</div><h3>No rides yet</h3><p>Book your first ride to get started</p></div>
          : rides.map(ride => (
            <Link key={ride._id} to={`/rides/${ride._id}`} className={`card ${styles.rideItem}`}>
              <div className={styles.rideIcon} style={{ background: ride.role === 'driver' ? 'rgba(0,229,255,0.1)' : 'rgba(124,77,255,0.1)' }}>
                {ride.role === 'driver' ? '🚗' : '🙋'}
              </div>
              <div className={styles.rideInfo}>
                <div className={styles.rideRoute}>{ride.origin?.city} → {ride.destination?.city}</div>
                <div className={styles.rideMeta}>{ride.role} · {new Date(ride.departureTime).toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className={`pill pill-${statusColor[ride.status]}`}>{ride.status.replace('_',' ')}</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--cyan)' }}>₹{ride.farePerPerson}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
