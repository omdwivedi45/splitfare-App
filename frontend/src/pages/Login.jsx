import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import toast from 'react-hot-toast'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ emailOrPhone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.emailOrPhone, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⚡</div>
          <span>SplitFare</span>
        </div>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.sub}>Sign in to continue your journey</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email or Phone</label>
            <input className="form-input" type="text" placeholder="you@email.com or 9876543210"
              value={form.emailOrPhone} onChange={e => setForm({...form, emailOrPhone: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter your password"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className={`btn btn-primary ${styles.submitBtn}`} type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In →'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don't have an account? <Link to="/register">Create one free →</Link>
        </p>

        <div className={styles.demo}>
          <div className={styles.demoTitle}>Demo Credentials</div>
          <div className={styles.demoItem} onClick={() => setForm({ emailOrPhone: 'admin@splitfare.in', password: 'admin123' })}>
            ⚙️ Admin — admin@splitfare.in / admin123
          </div>
          <div className={styles.demoItem} onClick={() => setForm({ emailOrPhone: 'driver@splitfare.in', password: 'test123' })}>
            🚗 Driver — driver@splitfare.in / test123
          </div>
          <div className={styles.demoItem} onClick={() => setForm({ emailOrPhone: 'rider@splitfare.in', password: 'test123' })}>
            🙋 Rider — rider@splitfare.in / test123
          </div>
        </div>
      </div>
    </div>
  )
}
