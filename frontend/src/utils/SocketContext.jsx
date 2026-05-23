import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('sf_token') }
    })

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('register', { userId: user._id, role: user.role })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('match_confirmed', (data) => {
      setNotifications(prev => [...prev, { type: 'match', ...data, id: Date.now() }])
    })

    socket.on('ride_request', (data) => {
      setNotifications(prev => [...prev, { type: 'request', ...data, id: Date.now() }])
    })

    socket.on('ride_started', (data) => {
      setNotifications(prev => [...prev, { type: 'started', ...data, id: Date.now() }])
    })

    socketRef.current = socket
    return () => socket.disconnect()
  }, [user])

  const emit = (event, data) => socketRef.current?.emit(event, data)
  const clearNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id))

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, emit, notifications, clearNotification }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
