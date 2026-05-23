import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import styles from './Vehicles.module.css'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ type: 'car', brand: '', model: '', year: new Date().getFullYear(), color: '', plateNumber: '', capacity: 5, fuelType: 'petrol', acAvailable: false })

  const set = k => e => setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    api.get('/vehicles/my').then(r => setVehicles(r.data.vehicles)).finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/vehicles', form)
      setVehicles(v => [res.data.vehicle, ...v])
      toast.success('Vehicle added! Pending admin verification.')
      setShowForm(false)
      setForm({ type: 'car', brand: '', model: '', year: new Date().getFullYear(), color: '', plateNumber: '', capacity: 5, fuelType: 'petrol', acAvailable: false })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle?')) return
    await api.delete(`/vehicles/${id}`)
    setVehicles(v => v.filter(x => x._id !== id))
    toast.success('Vehicle removed')
  }

  const typeIcon = { bike: '🏍️', car: '🚗', suv: '🚙', auto: '🛺' }
  const statusPill = { pending: 'pill-amber', approved: 'pill-green', rejected: 'pill-red' }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="flex-between" style={{ marginBottom: 32 }}>
          <div>
            <div className="section-tag">My Vehicles</div>
            <h1 className="section-title">Your Fleet</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Vehicle</button>
        </div>

        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /></div>
        : vehicles.length === 0 && !showForm
        ? <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">🚗</div>
            <h3>No vehicles yet</h3>
            <p>Add your first vehicle to start offering rides</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowForm(true)}>+ Add Vehicle</button>
          </div>
        : <div className={styles.grid}>
            {vehicles.map(v => (
              <div key={v._id} className={`card ${styles.vehicleCard}`}>
                <div className={styles.vHeader}>
                  <div className={styles.vIcon}>{typeIcon[v.type] || '🚗'}</div>
                  <div className={{ flex: 1 }}>
                    <div className={styles.vName}>{v.brand} {v.model}</div>
                    <div className={styles.vPlate}>{v.plateNumber} · {v.year}</div>
                  </div>
                  <span className={`pill ${statusPill[v.verificationStatus]}`}>{v.verificationStatus}</span>
                </div>
                <div className={styles.vDetails}>
                  <div className={styles.vDetail}><span>🎨</span>{v.color}</div>
                  <div className={styles.vDetail}><span>💺</span>{v.capacity} seats</div>
                  <div className={styles.vDetail}><span>⛽</span>{v.fuelType}</div>
                  {v.acAvailable && <div className={styles.vDetail}><span>❄️</span>AC</div>}
                  <div className={styles.vDetail}><span>🚘</span>{v.totalRides} rides</div>
                </div>
                <div className={styles.vFooter}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v._id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        }

        {/* Add Vehicle Modal */}
        {showForm && (
          <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <div className="modal" style={{ maxWidth: 580 }}>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: 6 }}>Add a Vehicle</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: 28 }}>Your vehicle will be verified by our admin team within 24 hours.</p>

              <form onSubmit={handleAdd}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.type} onChange={set('type')} required>
                      <option value="bike">🏍️ Bike</option>
                      <option value="car">🚗 Car</option>
                      <option value="suv">🚙 SUV</option>
                      <option value="auto">🛺 Auto</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuel Type</label>
                    <select className="form-input" value={form.fuelType} onChange={set('fuelType')}>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input className="form-input" placeholder="Honda, Maruti..." value={form.brand} onChange={set('brand')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input className="form-input" placeholder="City, Swift..." value={form.model} onChange={set('model')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input className="form-input" type="number" min="2000" max={new Date().getFullYear()} value={form.year} onChange={set('year')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input className="form-input" placeholder="White, Black..." value={form.color} onChange={set('color')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Number Plate</label>
                    <input className="form-input" placeholder="MP04 AB 1234" value={form.plateNumber} onChange={set('plateNumber')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Seats (incl. driver)</label>
                    <input className="form-input" type="number" min="2" max="8" value={form.capacity} onChange={set('capacity')} required />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer', color: 'var(--text2)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={form.acAvailable} onChange={e => setForm({...form, acAvailable: e.target.checked})} />
                  ❄️ Air Conditioning Available
                </label>
                <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', padding: '14px' }}>
                  {submitting ? <><span className="spinner" /> Adding...</> : '+ Add Vehicle'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
