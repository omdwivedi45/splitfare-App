import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import { useSocket } from '../utils/SocketContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import styles from './RideDetail.module.css'

export default function RideDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { emit } = useSocket()
  const navigate = useNavigate()
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const routeLayerRef = useRef(null)

  const fetchRide = () => api.get(`/rides/${id}`).then(r => setRide(r.data.ride)).catch(() => navigate('/rides'))
  useEffect(() => { fetchRide().finally(() => setLoading(false)) }, [id])

  // Join socket room for live tracking
  useEffect(() => { if (ride) emit('join_ride_room', { rideId: id }) }, [ride])

  // Initialize Leaflet map when ride is loaded
  useEffect(() => {
    if (!ride || !mapRef.current) return
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [ride.origin.lat, ride.origin.lng], 13
    )

    // Dark CartoDB tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map)

    // Custom marker factory
    const makeIcon = (label, color) => L.divIcon({
      className: '',
      html: `<div style="
        width:30px;height:30px;border-radius:50%;
        background:${color};border:3px solid #fff;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-weight:700;font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);">${label}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    L.marker([ride.origin.lat, ride.origin.lng], { icon: makeIcon('A', '#00e5ff') }).addTo(map)
    L.marker([ride.destination.lat, ride.destination.lng], { icon: makeIcon('B', '#7c4dff') }).addTo(map)

    // Draw route via OSRM
    const drawRoute = async () => {
      try {
        const { origin, destination } = ride
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        if (data.code !== 'Ok') return

        if (routeLayerRef.current) map.removeLayer(routeLayerRef.current)
        routeLayerRef.current = L.geoJSON(data.routes[0].geometry, {
          style: { color: '#00e5ff', weight: 4, opacity: 0.75, dashArray: '8 4' }
        }).addTo(map)

        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] })
      } catch { /* silent fail */ }
    }

    drawRoute()
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [ride])

  const isOwner = ride?.postedBy?._id === user?._id

  const acceptMatch = async (userId) => {
    await api.post(`/rides/${id}/accept/${userId}`)
    toast.success('Rider accepted! 🤝')
    fetchRide()
  }
  const startRide = async () => {
    await api.post(`/rides/${id}/start`)
    toast.success('Ride started! 🚗')
    fetchRide()
  }
  const completeRide = async () => {
    await api.post(`/rides/${id}/complete`)
    toast.success('Ride completed! 🎉')
    fetchRide()
  }
  const cancelRide = async () => {
    if (!confirm('Cancel this ride?')) return
    await api.post(`/rides/${id}/cancel`, { reason: 'Cancelled by user' })
    toast.success('Ride cancelled')
    navigate('/rides')
  }

  const statusColor = { posted: 'cyan', matched: 'amber', in_progress: 'green', completed: 'green', cancelled: 'red' }

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner spinner-lg" /></div>
  if (!ride) return null

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="flex-between" style={{ marginBottom: 28 }}>
          <div>
            <div className="section-tag">Ride Details</div>
            <h1 className="section-title" style={{ fontSize: '2rem' }}>
              {ride.origin?.city} → {ride.destination?.city}
            </h1>
          </div>
          <span className={`pill pill-${statusColor[ride.status]}`} style={{ padding: '8px 18px', fontSize: '0.85rem', textTransform: 'capitalize' }}>{ride.status.replace('_', ' ')}</span>
        </div>

        <div className={styles.layout}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Route card */}
            <div className="card" style={{ padding: 28, background: 'var(--bg2)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 20 }}>Route Details</div>
              <div className={styles.routeRow}>
                <div className={styles.routeDot} style={{ background: 'var(--cyan)' }} />
                <div><div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: 2 }}>ORIGIN</div><div style={{ fontWeight: 500 }}>{ride.origin?.address}</div></div>
              </div>
              <div className={styles.routeLine} />
              <div className={styles.routeRow}>
                <div className={styles.routeDot} style={{ background: 'var(--purple)' }} />
                <div><div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: 2 }}>DESTINATION</div><div style={{ fontWeight: 500 }}>{ride.destination?.address}</div></div>
              </div>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}><span>🕐 Departure</span><strong>{new Date(ride.departureTime).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</strong></div>
                <div className={styles.metaItem}><span>📏 Distance</span><strong>{ride.estimatedDistance} km</strong></div>
                <div className={styles.metaItem}><span>💺 Seats</span><strong>{ride.seatsAvailable - ride.seatsBooked} available</strong></div>
                <div className={styles.metaItem}><span>💰 Fare/person</span><strong style={{ color: 'var(--cyan)' }}>₹{ride.farePerPerson}</strong></div>
              </div>
            </div>

            {/* Poster card */}
            <div className="card" style={{ padding: 24, background: 'var(--bg2)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Posted By</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar" style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#00e5ff44,#7c4dff22)', fontSize: '1.4rem' }}>
                  {ride.postedBy?.avatar ? <img src={ride.postedBy.avatar} alt="" /> : ride.postedBy?.name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{ride.postedBy?.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 2 }}>⭐ {ride.postedBy?.rating?.toFixed(1)} · {ride.postedBy?.city} · {ride.role}</div>
                </div>
                {ride.postedBy?.verificationStatus === 'approved' && <span className="pill pill-cyan" style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>✓ Verified</span>}
              </div>
            </div>

            {/* Vehicle card */}
            {ride.vehicle && (
              <div className="card" style={{ padding: 24, background: 'var(--bg2)' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Vehicle</div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {[
                    { icon: '🚗', val: `${ride.vehicle.brand} ${ride.vehicle.model}` },
                    { icon: '📋', val: ride.vehicle.plateNumber },
                    { icon: '🎨', val: ride.vehicle.color },
                    { icon: '⛽', val: ride.vehicle.fuelType },
                    { icon: '💺', val: `${ride.vehicle.capacity} seats` },
                    ...(ride.vehicle.acAvailable ? [{ icon: '❄️', val: 'AC Available' }] : []),
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', color: 'var(--text2)', display: 'flex', gap: 6 }}>
                      <span>{item.icon}</span>{item.val}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {isOwner && (
              <div className="card" style={{ padding: 24, background: 'var(--bg2)' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>Actions</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {ride.status === 'matched' && <button className="btn btn-primary" onClick={startRide}>🚗 Start Ride</button>}
                  {ride.status === 'in_progress' && <button className="btn btn-primary" style={{ background: 'var(--green)', color: '#000' }} onClick={completeRide}>✅ Complete Ride</button>}
                  {['posted','matched'].includes(ride.status) && <button className="btn btn-danger" onClick={cancelRide}>❌ Cancel Ride</button>}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Map */}
            <div className="card" style={{ overflow: 'hidden', padding: 0, background: 'var(--bg2)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', fontSize: '0.84rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><span className="live-dot" />Live Map</span>
                {ride.status === 'in_progress' && <span className="pill pill-green" style={{ fontSize: '0.72rem' }}>Ride in Progress</span>}
              </div>
              <div ref={mapRef} style={{ width: '100%', height: 320 }} />
            </div>

            {/* Matches/Riders */}
            <div className="card" style={{ padding: 24, background: 'var(--bg2)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>
                Riders ({ride.matches?.length || 0})
              </div>
              {ride.matches?.length === 0
                ? <div style={{ color: 'var(--text2)', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>No riders yet. Matches will appear here.</div>
                : ride.matches?.map(m => (
                  <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                    <div className="avatar" style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#00e5ff33,#7c4dff22)', fontSize: '1rem' }}>{m.user?.name?.[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{m.user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>⭐ {m.user?.rating?.toFixed(1)}</div>
                    </div>
                    <span className={`pill pill-${m.status === 'accepted' ? 'green' : m.status === 'rejected' ? 'red' : 'amber'}`} style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{m.status}</span>
                    {isOwner && m.status === 'pending' && (
                      <button className="btn btn-primary btn-sm" onClick={() => acceptMatch(m.user?._id)}>Accept</button>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
