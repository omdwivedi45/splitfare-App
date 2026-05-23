import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './utils/AuthContext'
import { SocketProvider } from './utils/SocketContext'
import Navbar from './components/Navbar'
import Notifications from './components/Notifications'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BookRide from './pages/BookRide'
import MyRides from './pages/MyRides'
import RideDetail from './pages/RideDetail'
import Matches from './pages/Matches'
import Vehicles from './pages/Vehicles'
import Profile from './pages/Profile'
import Payments from './pages/Payments'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminVehicles from './pages/admin/AdminVehicles'
import AdminRides from './pages/admin/AdminRides'
import AdminPayments from './pages/admin/AdminPayments'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner spinner-lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner spinner-lg" /></div>
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppInner() {
  const { user } = useAuth()
  return (
    <>
      <Navbar />
      {user && <Notifications />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* User */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/book" element={<PrivateRoute><BookRide /></PrivateRoute>} />
        <Route path="/rides" element={<PrivateRoute><MyRides /></PrivateRoute>} />
        <Route path="/rides/:id" element={<PrivateRoute><RideDetail /></PrivateRoute>} />
        <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
        <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/users/:id" element={<PrivateRoute adminOnly><AdminUserDetail /></PrivateRoute>} />
        <Route path="/admin/vehicles" element={<PrivateRoute adminOnly><AdminVehicles /></PrivateRoute>} />
        <Route path="/admin/rides" element={<PrivateRoute adminOnly><AdminRides /></PrivateRoute>} />
        <Route path="/admin/payments" element={<PrivateRoute adminOnly><AdminPayments /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppInner />
      </SocketProvider>
    </AuthProvider>
  )
}
