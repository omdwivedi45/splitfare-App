import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import styles from './BookRide.module.css'

// Nominatim geocoder (free, no API key needed)
const nominatimGeocode = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  const data = await res.json()
  if (!data.length) throw new Error('Location not found')
  const item = data[0]
  const city =
    item.address?.city ||
    item.address?.town ||
    item.address?.village ||
    item.address?.state_district ||
    ''
  return {
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    address: item.display_name,
    city,
  }
}

export default function BookRide() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState(user?.role === 'driver' ? 'driver' : 'rider')
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [seats, setSeats] = useState(1)
  const [form, setForm] = useState({
    originAddress: '', originLat: '', originLng: '', originCity: '',
    destAddress: '', destLat: '', destLng: '', destCity: '',
    departureTime: '',
    preferences: { noSmoking: true, femaleOnly: false, acRequired: false, petAllowed: false }
  })
  const [farePreview, setFarePreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)

  useEffect(() => {
    if (user?.role !== 'rider') api.get('/vehicles/my').then(r => setVehicles(r.data.vehicles))
  }, [user])

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, { zoomControl: true }).setView([23.2599, 77.4126], 12)

    // Dark-themed tile layer using CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  const addMarker = (lat, lng, label, color) => {
    const L = window.L
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:32px;height:32px;border-radius:50%;
        background:${color};border:3px solid #fff;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-weight:700;font-size:13px;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    const marker = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current)
    markersRef.current.push(marker)
    return marker
  }

  const clearMarkers = () => {
    markersRef.current.forEach(m => mapInstanceRef.current?.removeLayer(m))
    markersRef.current = []
    if (routeLayerRef.current) {
      mapInstanceRef.current?.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
  }

  const drawRoute = async (oLat, oLng, dLat, dLng) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const data = await res.json()
      if (data.code !== 'Ok') return

      const L = window.L
      if (routeLayerRef.current) mapInstanceRef.current?.removeLayer(routeLayerRef.current)

      routeLayerRef.current = L.geoJSON(data.routes[0].geometry, {
        style: { color: '#00e5ff', weight: 4, opacity: 0.75, dashArray: '8 4' }
      }).addTo(mapInstanceRef.current)

      mapInstanceRef.current?.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] })

      // Fare calculation from OSRM distance
      const dist = data.routes[0].distance / 1000
      const rate = role === 'driver' ? 15 : 12
      const total = Math.round(dist * rate + 30)
      const perPerson = Math.round(total / (seats + 1))
      setFarePreview({ dist: dist.toFixed(1), total, perPerson, savings: total - perPerson })
    } catch { /* silent */ }
  }

  const handleSetOrigin = async () => {
    if (!form.originAddress) return toast.error('Enter origin first')
    try {
      const loc = await nominatimGeocode(form.originAddress)
      setForm(f => ({ ...f, originLat: loc.lat, originLng: loc.lng, originAddress: loc.address, originCity: loc.city }))
      clearMarkers()
      addMarker(loc.lat, loc.lng, 'A', '#00e5ff')
      mapInstanceRef.current?.setView([loc.lat, loc.lng], 13)
      toast.success('Origin set ✅')
    } catch { toast.error('Could not find location') }
  }

  const handleSetDest = async () => {
    if (!form.destAddress) return toast.error('Enter destination first')
    try {
      const loc = await nominatimGeocode(form.destAddress)
      setForm(f => ({ ...f, destLat: loc.lat, destLng: loc.lng, destAddress: loc.address, destCity: loc.city }))
      // Keep origin marker, add dest marker
      const existingOriginMarker = markersRef.current[0]
      clearMarkers()
      if (form.originLat) addMarker(parseFloat(form.originLat), parseFloat(form.originLng), 'A', '#00e5ff')
      addMarker(loc.lat, loc.lng, 'B', '#7c4dff')

      if (form.originLat) {
        await drawRoute(parseFloat(form.originLat), parseFloat(form.originLng), loc.lat, loc.lng)
      }
      toast.success('Destination set ✅')
    } catch { toast.error('Could not find location') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.originLat || !form.destLat) return toast.error('Please set origin and destination on map first')
    if (!form.departureTime) return toast.error('Select departure time')
    if (role === 'driver' && !selectedVehicle) return toast.error('Select a vehicle')
    setLoading(true)
    try {
      const payload = {
        role, seatsAvailable: seats,
        origin: { address: form.originAddress, lat: parseFloat(form.originLat), lng: parseFloat(form.originLng), city: form.originCity },
        destination: { address: form.destAddress, lat: parseFloat(form.destLat), lng: parseFloat(form.destLng), city: form.destCity },
        departureTime: form.departureTime,
        preferences: form.preferences,
        ...(role === 'driver' ? { vehicle: selectedVehicle } : {})
      }
      const res = await api.post('/rides', payload)
      toast.success('Ride posted! Finding matches...')
      navigate(`/rides/${res.data.ride._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post ride')
    } finally { setLoading(false) }
  }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="section-tag">Book a Ride</div>
        <h1 className="section-title">Where are you headed?</h1>

        <div className={styles.layout}>
          {/* Form */}
          <div className={`card ${styles.form}`}>
            <div className={styles.roleRow}>
              {['rider','driver'].map(r => (
                <button key={r} type="button"
                  className={`${styles.roleBtn} ${role === r ? styles.active : ''}`}
                  onClick={() => setRole(r)}>
                  {r === 'rider' ? '🙋 I need a lift' : '🚗 I have a vehicle'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Pick-up Location</label>
                <div className={styles.inputRow}>
                  <input className="form-input" placeholder="e.g. New Market, Bhopal"
                    value={form.originAddress} onChange={e => setForm({...form, originAddress: e.target.value})} required />
                  <button type="button" className={`btn btn-secondary btn-sm ${styles.pinBtn}`} onClick={handleSetOrigin}>📍 Set</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Destination</label>
                <div className={styles.inputRow}>
                  <input className="form-input" placeholder="e.g. DB Mall, Bhopal"
                    value={form.destAddress} onChange={e => setForm({...form, destAddress: e.target.value})} required />
                  <button type="button" className={`btn btn-secondary btn-sm ${styles.pinBtn}`} onClick={handleSetDest}>🎯 Set</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Departure Time</label>
                <input className="form-input" type="datetime-local"
                  value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} required
                  min={new Date().toISOString().slice(0,16)} />
              </div>

              {role === 'driver' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Vehicle</label>
                    {vehicles.length === 0
                      ? <div className={styles.noVehicle}>No vehicles registered. <a href="/vehicles">Add one →</a></div>
                      : <select className="form-input" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} required>
                          <option value="">Select vehicle</option>
                          {vehicles.map(v => <option key={v._id} value={v._id}>{v.brand} {v.model} · {v.plateNumber}</option>)}
                        </select>
                    }
                  </div>
                  <div className="form-group">
                    <label className="form-label">Seats for Riders</label>
                    <div className={styles.seatRow}>
                      {[1,2,3,4].map(n => (
                        <button key={n} type="button"
                          className={`${styles.seatBtn} ${seats === n ? styles.seatActive : ''}`}
                          onClick={() => setSeats(n)}>{n}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Preferences</label>
                <div className={styles.prefRow}>
                  {[
                    { key: 'noSmoking', label: '🚭 No Smoking' },
                    { key: 'acRequired', label: '❄️ AC Required' },
                    { key: 'femaleOnly', label: '👩 Female Only' },
                    { key: 'petAllowed', label: '🐾 Pet Allowed' },
                  ].map(p => (
                    <label key={p.key} className={`${styles.prefChip} ${form.preferences[p.key] ? styles.prefActive : ''}`}>
                      <input type="checkbox" style={{ display: 'none' }}
                        checked={form.preferences[p.key]}
                        onChange={e => setForm({ ...form, preferences: { ...form.preferences, [p.key]: e.target.checked } })} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              {farePreview && (
                <div className={styles.fareBox}>
                  <div className={styles.fareRow}><span>Distance</span><span>{farePreview.dist} km</span></div>
                  <div className={styles.fareRow}><span>Full Fare</span><span>₹{farePreview.total}</span></div>
                  <div className={styles.fareRow}><span>Your Split Fare</span><span style={{ color: 'var(--cyan)', fontWeight: 700 }}>₹{farePreview.perPerson}/person</span></div>
                  <div className={styles.fareRow} style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, marginTop: 4 }}>
                    <span>Your Savings</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>₹{farePreview.savings} 🎉</span>
                  </div>
                </div>
              )}

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                {loading ? <><span className="spinner" /> Posting ride...</> : '🔍 Post & Find Matches'}
              </button>
            </form>
          </div>

          {/* Map */}
          <div className={`card ${styles.mapCard}`}>
            <div className={styles.mapHeader}>
              <span><span className="live-dot" />Live Map</span>
              <span className="pill pill-cyan" style={{ fontSize: '0.72rem' }}>OpenStreetMap</span>
            </div>
            <div ref={mapRef} id="leaflet-map" style={{ width: '100%', height: '500px', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
