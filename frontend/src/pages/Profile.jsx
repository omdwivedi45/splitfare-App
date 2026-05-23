import { useState } from 'react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', city: user?.city || '',
    address: user?.address || '', state: user?.state || '',
    emergencyContact: user?.emergencyContact || { name: '', phone: '', relation: '' }
  })
  const [verForm, setVerForm] = useState({ govIdType: 'aadhar', govIdNumber: '', govIdImage: '', selfieImage: '' })

  const set = k => e => setForm({ ...form, [k]: e.target.value })

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put('/auth/update-profile', form)
      updateUser(res.data.user)
      toast.success('Profile updated ✅')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const submitVerification = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put('/auth/submit-verification', verForm)
      updateUser(res.data.user)
      toast.success('Verification submitted! Admin will review within 24 hrs.')
    } catch { toast.error('Failed to submit') } finally { setSaving(false) }
  }

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const changePw = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/auth/change-password', pwForm)
      toast.success('Password changed ✅')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'verify', label: '🛡️ Verification' },
    { id: 'security', label: '🔒 Security' },
  ]

  const verStatus = { pending: { pill: 'pill-amber', text: '⏳ Pending Review' }, approved: { pill: 'pill-green', text: '✅ Verified' }, rejected: { pill: 'pill-red', text: '❌ Rejected' } }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 800 }}>
        <div className="section-tag">Account</div>
        <h1 className="section-title">Your Profile</h1>

        {/* Profile header card */}
        <div className={`card ${styles.profileHero}`}>
          <div className={styles.heroOrb} />
          <div className={styles.avatarWrap}>
            <div className={styles.bigAvatar}>{user?.avatar ? <img src={user.avatar} alt="" /> : user?.name?.[0]}</div>
          </div>
          <div className={styles.heroInfo}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>{user?.name}</h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginTop: 4 }}>{user?.email} · {user?.phone}</p>
            <div className={styles.heroStats}>
              {[
                { v: user?.totalRides || 0, l: 'Rides' },
                { v: `₹${user?.totalSavings || 0}`, l: 'Saved' },
                { v: user?.rating?.toFixed(1) || '5.0', l: 'Rating' },
                { v: `${(user?.co2Saved || 0).toFixed(1)}kg`, l: 'CO₂ ↓' },
              ].map((s, i) => <div key={i} className={styles.heroStat}><div className={styles.heroStatVal}>{s.v}</div><div className={styles.heroStatLabel}>{s.l}</div></div>)}
            </div>
          </div>
          <div>
            <span className={`pill ${verStatus[user?.verificationStatus]?.pill || 'pill-amber'}`}>{verStatus[user?.verificationStatus]?.text || '⏳ Pending'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {tabs.map(t => <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.active : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className={`card ${styles.tabCard}`}>
            <form onSubmit={saveProfile}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={set('phone')} /></div>
                <div className="form-group"><label className="form-label">City</label><input className="form-input" placeholder="Bhopal" value={form.city} onChange={set('city')} /></div>
                <div className="form-group"><label className="form-label">State</label><input className="form-input" placeholder="Madhya Pradesh" value={form.state} onChange={set('state')} /></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" placeholder="Street, Area" value={form.address} onChange={set('address')} /></div>

              <div style={{ marginTop: 8, marginBottom: 20, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>Emergency Contact</div>
              <div className="grid-3">
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" placeholder="Contact name" value={form.emergencyContact.name} onChange={e => setForm({...form, emergencyContact:{...form.emergencyContact, name: e.target.value}})} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="Phone" value={form.emergencyContact.phone} onChange={e => setForm({...form, emergencyContact:{...form.emergencyContact, phone: e.target.value}})} /></div>
                <div className="form-group"><label className="form-label">Relation</label><input className="form-input" placeholder="Father, Friend..." value={form.emergencyContact.relation} onChange={e => setForm({...form, emergencyContact:{...form.emergencyContact, relation: e.target.value}})} /></div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}</button>
            </form>
          </div>
        )}

        {/* Verification Tab */}
        {tab === 'verify' && (
          <div className={`card ${styles.tabCard}`}>
            {user?.verificationStatus === 'approved'
              ? <div style={{ textAlign: 'center', padding: '40px 20px' }}><div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div><h3 style={{ fontFamily: 'Syne, sans-serif' }}>You're Verified!</h3><p style={{ color: 'var(--text2)', marginTop: 8 }}>Your identity has been confirmed by our admin team.</p></div>
              : <form onSubmit={submitVerification}>
                  <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: 28, lineHeight: 1.6 }}>Submit a government-issued ID and a selfie for identity verification. Verified users get a ✓ badge and higher trust scores.</p>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">ID Type</label>
                      <select className="form-input" value={verForm.govIdType} onChange={e => setVerForm({...verForm, govIdType: e.target.value})}>
                        <option value="aadhar">Aadhaar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="dl">Driving Licence</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">ID Number</label>
                      <input className="form-input" placeholder="XXXX XXXX XXXX" value={verForm.govIdNumber} onChange={e => setVerForm({...verForm, govIdNumber: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Government ID Image URL (Cloudinary)</label>
                    <input className="form-input" placeholder="https://res.cloudinary.com/..." value={verForm.govIdImage} onChange={e => setVerForm({...verForm, govIdImage: e.target.value})} required />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 6 }}>Upload to Cloudinary first, paste the URL here</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selfie Image URL (Cloudinary)</label>
                    <input className="form-input" placeholder="https://res.cloudinary.com/..." value={verForm.selfieImage} onChange={e => setVerForm({...verForm, selfieImage: e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <><span className="spinner" /> Submitting...</> : 'Submit for Verification'}</button>
                </form>
            }
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className={`card ${styles.tabCard}`}>
            <form onSubmit={changePw}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 24 }}>Change Password</h3>
              <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} required minLength={6} /></div>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <><span className="spinner" /> Updating...</> : 'Change Password'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
