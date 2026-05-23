import { useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import styles from './Matches.module.css'

export default function Matches() {
  const [form, setForm] = useState({ originLat: '', originLng: '', destLat: '', destLng: '', role: 'rider', departureTime: '' })
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const geocode = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    if (!data.length) throw new Error('Not found')
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }

  const [originAddr, setOriginAddr] = useState('')
  const [destAddr, setDestAddr] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSearched(true)
    try {
      let oLat = form.originLat, oLng = form.originLng
      let dLat = form.destLat, dLng = form.destLng
      // If no coords yet, geocode the addresses
      if (!oLat && originAddr) {
        const loc = await geocode(originAddr)
        oLat = loc.lat; oLng = loc.lng
      }
      if (!dLat && destAddr) {
        const loc = await geocode(destAddr)
        dLat = loc.lat; dLng = loc.lng
      }
      if (!oLat || !dLat) return toast.error('Please enter valid locations')

      const res = await api.get('/rides/find', {
        params: { originLat: oLat, originLng: oLng, destLat: dLat, destLng: dLng, role: form.role, departureTime: form.departureTime || new Date().toISOString() }
      })
      setMatches(res.data.matches)
      if (res.data.matches.length === 0) toast('No matches found right now. Try a wider time window.', { icon: '🔍' })
    } catch (err) {
      toast.error('Search failed')
    } finally { setLoading(false) }
  }

  const requestRide = async (rideId) => {
    try {
      await api.post(`/rides/${rideId}/request`)
      toast.success('Request sent! Waiting for confirmation.')
      setMatches(m => m.filter(x => x.ride._id !== rideId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request')
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="section-tag">Live Matching</div>
        <h1 className="section-title">Find Rides Near You</h1>

        <div className={`card ${styles.searchCard}`}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">From</label>
              <input className="form-input" placeholder="Origin address" value={originAddr} onChange={e => setOriginAddr(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">To</label>
              <input className="form-input" placeholder="Destination address" value={destAddr} onChange={e => setDestAddr(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">I am a</label>
              <select className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="rider">Rider (need lift)</option>
                <option value="driver">Driver (offering ride)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input className="form-input" type="datetime-local" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap', padding: '13px 24px' }}>
              {loading ? <><span className="spinner" /> Searching...</> : '🔍 Find Matches'}
            </button>
          </form>
        </div>

        {loading && <div className="flex-center" style={{ height: 200 }}><div className="spinner spinner-lg" /><span style={{ marginLeft: 16, color: 'var(--text2)' }}>Scanning nearby routes...</span></div>}

        {!loading && searched && matches.length === 0 && (
          <div className="empty-state"><div className="empty-state-icon">🔍</div><h3>No matches found</h3><p>Try changing your departure time window or post your own ride</p></div>
        )}

        {!loading && matches.length > 0 && (
          <>
            <div className="flex-between" style={{ margin: '32px 0 16px' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>{matches.length} Matches Found</h2>
              <span className="pill pill-green"><span className="live-dot" />Live Results</span>
            </div>
            <div className={styles.matchesGrid}>
              {matches.map(({ ride, routeMatch, originDist }) => (
                <div key={ride._id} className={`card ${styles.matchCard}`}>
                  <div className={styles.matchHeader}>
                    <div className="avatar" style={{ width: 50, height: 50, background: `linear-gradient(135deg, #00e5ff44, #7c4dff22)`, fontSize: '1.4rem' }}>
                      {ride.postedBy?.avatar ? <img src={ride.postedBy.avatar} alt="" /> : ride.postedBy?.name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{ride.postedBy?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 2 }}>
                        ⭐ {ride.postedBy?.rating?.toFixed(1)} · {ride.postedBy?.totalRides} rides · {ride.role}
                        {ride.postedBy?.verificationStatus === 'approved' && <span style={{ color: 'var(--cyan)', marginLeft: 6 }}>✓ Verified</span>}
                      </div>
                    </div>
                    <div className={`pill ${routeMatch >= 80 ? 'pill-green' : routeMatch >= 60 ? 'pill-cyan' : 'pill-amber'}`}>{routeMatch}% match</div>
                  </div>

                  <div className={styles.routeInfo}>
                    <div className={styles.routePoint}>
                      <div className={styles.routeDot} style={{ background: 'var(--cyan)' }} />
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>FROM</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ride.origin?.address?.slice(0, 40)}</div>
                      </div>
                    </div>
                    <div className={styles.routeLine} />
                    <div className={styles.routePoint}>
                      <div className={styles.routeDot} style={{ background: 'var(--purple)' }} />
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>TO</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ride.destination?.address?.slice(0, 40)}</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.matchMeta}>
                    <div className={styles.metaItem}><span>🕐</span>{new Date(ride.departureTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    <div className={styles.metaItem}><span>📍</span>{originDist?.toFixed(1)} km away</div>
                    <div className={styles.metaItem}><span>💺</span>{ride.seatsAvailable - ride.seatsBooked} seats left</div>
                    {ride.vehicle && <div className={styles.metaItem}><span>🚗</span>{ride.vehicle.brand} {ride.vehicle.model}</div>}
                  </div>

                  <div className={styles.matchFooter}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 3 }}>FARE PER PERSON</div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: 'var(--cyan)' }}>₹{ride.farePerPerson}</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => requestRide(ride._id)}>Connect →</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
