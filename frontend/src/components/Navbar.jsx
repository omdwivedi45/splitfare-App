import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import { useSocket } from '../utils/SocketContext'
import { useState } from 'react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { connected, notifications } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const navLinks = user?.role === 'admin'
    ? [{ to: '/admin', label: 'Dashboard', icon: '📊' }, { to: '/admin/users', label: 'Users', icon: '👥' }, { to: '/admin/vehicles', label: 'Vehicles', icon: '🚗' }, { to: '/admin/rides', label: 'Rides', icon: '🛣️' }, { to: '/admin/payments', label: 'Payments', icon: '💳' }]
    : [{ to: '/dashboard', label: 'Home', icon: '🏠' }, { to: '/book', label: 'Book Ride', icon: '🔍' }, { to: '/matches', label: 'Matches', icon: '🤝' }, { to: '/rides', label: 'My Rides', icon: '🚘' }, { to: '/vehicles', label: 'Vehicles', icon: '🚗' }, { to: '/payments', label: 'Payments', icon: '💳' }]

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>⚡</div>
          <span>SplitFare</span>
          {user && <span className={styles.connDot} style={{ background: connected ? 'var(--green)' : 'var(--red)' }} title={connected ? 'Live' : 'Offline'} />}
        </Link>

        {user && (
          <div className={styles.links}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`${styles.link} ${location.pathname.startsWith(l.to) && l.to !== '/' ? styles.active : ''}`}>
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
        )}

        <div className={styles.right}>
          {!user ? (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          ) : (
            <div className={styles.userMenu}>
              {notifications.length > 0 && (
                <div className={styles.notifBadge}>{notifications.length}</div>
              )}
              <button className={styles.avatar} onClick={() => setMenuOpen(!menuOpen)}>
                {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name?.[0]?.toUpperCase()}
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropUser}>
                    <div className={styles.dropName}>{user.name}</div>
                    <div className={styles.dropRole}>{user.role} · ⭐ {user.rating?.toFixed(1)}</div>
                  </div>
                  <div className={styles.dropDivider} />
                  <Link to="/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>👤 Profile</Link>
                  <Link to="/payments" className={styles.dropItem} onClick={() => setMenuOpen(false)}>💳 Payments</Link>
                  {user.role === 'admin' && <Link to="/admin" className={styles.dropItem} onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</Link>}
                  <div className={styles.dropDivider} />
                  <button className={styles.dropItem} style={{ color: 'var(--red)', width: '100%', textAlign: 'left' }} onClick={handleLogout}>🚪 Log out</button>
                </div>
              )}
            </div>
          )}
          <button className={styles.burger} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>
    </nav>
  )
}
