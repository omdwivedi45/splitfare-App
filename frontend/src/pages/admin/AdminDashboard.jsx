import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import api from '../../utils/api'
import styles from './Admin.module.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892aa' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892aa' } } },
  responsive: true, maintainAspectRatio: false,
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner spinner-lg" /></div>

  const { stats, recentUsers, recentRides, monthlyTrend } = data

  const monthLabels = monthlyTrend.map(m => {
    const d = new Date(2024, m._id.month - 1); return d.toLocaleString('default', { month: 'short' })
  })
  const monthCounts = monthlyTrend.map(m => m.count)

  const kpis = [
    { label: 'Total Users', val: stats.totalUsers, icon: '👥', color: 'var(--cyan)', change: '+12%' },
    { label: 'Total Rides', val: stats.totalRides, icon: '🚘', color: 'var(--purple)', change: '+18%' },
    { label: 'Revenue', val: `₹${(stats.totalRevenue/1000).toFixed(1)}K`, icon: '💰', color: 'var(--green)', change: '+24%' },
    { label: 'Vehicles', val: stats.totalVehicles, icon: '🚗', color: 'var(--amber)', change: '+8%' },
    { label: 'Pending Verif.', val: stats.pendingVerifications, icon: '⏳', color: 'var(--red)', alert: true },
    { label: 'Match Rate', val: `${stats.matchRate}%`, icon: '🤝', color: '#b39ddb', change: '+3%' },
    { label: 'Active Rides', val: stats.activeRides, icon: '🟢', color: 'var(--green)' },
    { label: 'Completed', val: stats.completedRides, icon: '✅', color: 'var(--cyan)', change: '+22%' },
  ]

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="flex-between" style={{ marginBottom: 36 }}>
          <div>
            <div className="section-tag">Admin Panel</div>
            <h1 className="section-title">Platform Overview</h1>
          </div>
          <div className="flex gap-8">
            <span className="pill pill-green"><span className="live-dot" />Live Dashboard</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className={styles.kpiGrid}>
          {kpis.map((k, i) => (
            <div key={i} className={`card ${styles.kpiCard} ${k.alert && k.val > 0 ? styles.alertCard : ''}`}>
              <div className={styles.kpiTop}>
                <div style={{ fontSize: '1.6rem' }}>{k.icon}</div>
                {k.change && <span className="pill pill-green" style={{ fontSize: '0.68rem' }}>{k.change}</span>}
                {k.alert && k.val > 0 && <span className="pill pill-red" style={{ fontSize: '0.68rem' }}>Action needed</span>}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: k.color, marginTop: 8 }}>{k.val}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions for pending items */}
        {(stats.pendingVerifications > 0 || stats.pendingVehicles > 0) && (
          <div className={styles.alertBanner}>
            <span>⚠️ Action required: </span>
            {stats.pendingVerifications > 0 && <Link to="/admin/users?verificationStatus=pending">{stats.pendingVerifications} users pending verification</Link>}
            {stats.pendingVehicles > 0 && <><span> · </span><Link to="/admin/vehicles?verificationStatus=pending">{stats.pendingVehicles} vehicles pending verification</Link></>}
          </div>
        )}

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          <div className="card" style={{ padding: 28, background: 'var(--bg2)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 4 }}>Monthly Rides Trend</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.78rem', marginBottom: 20 }}>Total ride postings per month</div>
            <div style={{ height: 220 }}>
              <Line
                data={{ labels: monthLabels, datasets: [{ label: 'Rides', data: monthCounts, borderColor: '#00e5ff', backgroundColor: 'rgba(0,229,255,0.06)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#00e5ff' }] }}
                options={chartDefaults}
              />
            </div>
          </div>
          <div className="card" style={{ padding: 28, background: 'var(--bg2)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 4 }}>Ride Status Split</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.78rem', marginBottom: 20 }}>Completed vs Cancelled vs Active</div>
            <div style={{ height: 220 }}>
              <Doughnut
                data={{ labels: ['Completed', 'Cancelled', 'Active', 'Posted'], datasets: [{ data: [stats.completedRides, stats.cancelledRides, stats.activeRides, stats.totalRides - stats.completedRides - stats.cancelledRides - stats.activeRides], backgroundColor: ['rgba(0,230,118,0.7)', 'rgba(255,82,82,0.7)', 'rgba(0,229,255,0.7)', 'rgba(124,77,255,0.7)'], borderColor: 'transparent', hoverOffset: 5 }] }}
                options={{ ...chartDefaults, cutout: '70%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#8892aa', padding: 14, usePointStyle: true } } }, scales: {} }}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.recentRow}>
          <div className="card" style={{ padding: 28, background: 'var(--bg2)' }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Recent Users</div>
              <Link to="/admin/users" className="btn btn-secondary btn-sm">View all →</Link>
            </div>
            {recentUsers.map(u => (
              <Link key={u._id} to={`/admin/users/${u._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div className="avatar" style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#00e5ff44,#7c4dff22)', fontSize: '1rem' }}>{u.name?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text2)' }}>{u.phone} · {u.city}</div>
                  </div>
                  <span className={`pill pill-${u.verificationStatus === 'approved' ? 'green' : u.verificationStatus === 'rejected' ? 'red' : 'amber'}`} style={{ fontSize: '0.68rem' }}>{u.verificationStatus}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="card" style={{ padding: 28, background: 'var(--bg2)' }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Recent Rides</div>
              <Link to="/admin/rides" className="btn btn-secondary btn-sm">View all →</Link>
            </div>
            {recentRides.map(r => (
              <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{r.role === 'driver' ? '🚗' : '🙋'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{r.postedBy?.name}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text2)' }}>{r.origin?.city} → {r.destination?.city}</div>
                </div>
                <span className={`pill pill-${r.status === 'completed' ? 'green' : r.status === 'cancelled' ? 'red' : 'cyan'}`} style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{r.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
