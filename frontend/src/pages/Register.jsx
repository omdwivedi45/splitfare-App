import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import toast from 'react-hot-toast'
import styles from './Auth.module.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', gender: 'male', role: 'rider', city: ''
  })

  const set = k => e => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to SplitFare 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <div className={styles.card} style={{ maxWidth: 520 }}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⚡</div><span>SplitFare</span>
        </div>
        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.sub}>Join thousands saving on commute every day</p>

        <div className={styles.roleRow}>
          {['rider', 'driver', 'both'].map(r => (
            <button key={r} type="button"
              className={`${styles.roleBtn} ${form.role === r ? styles.active : ''}`}
              onClick={() => setForm({ ...form, role: r })}>
              {r === 'rider' ? '🙋 Rider' : r === 'driver' ? '🚗 Driver' : '⚡ Both'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.twoCol}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Arjun Sharma" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={form.gender} onChange={set('gender')} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="arjun@email.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className={styles.twoCol}>
            <div className="form-group">
              <label className="form-label">Phone (10-digit)</label>
              <input className="form-input" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} pattern="[6-9][0-9]{9}" required />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" placeholder="Bhopal" value={form.city} onChange={set('city')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
          </div>

          <button className={`btn btn-primary ${styles.submitBtn}`} type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account →'}
          </button>
        </form>

        <p className={styles.switchLink}>Already have an account? <Link to="/login">Sign in →</Link></p>
      </div>
    </div>
  )
}
