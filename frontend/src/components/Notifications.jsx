import { useSocket } from '../utils/SocketContext'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function Notifications() {
  const { notifications, clearNotification } = useSocket()

  useEffect(() => {
    notifications.forEach(n => {
      if (n._shown) return
      n._shown = true
      if (n.type === 'match') {
        toast.success(`✅ Match confirmed! Your ride is set.`, { duration: 5000 })
      } else if (n.type === 'request') {
        toast(`🙋 ${n.fromUser} wants to join your ride!`, { duration: 6000, icon: '🤝' })
      } else if (n.type === 'started') {
        toast(`🚗 Your ride has started!`, { duration: 4000 })
      }
      setTimeout(() => clearNotification(n.id), 6000)
    })
  }, [notifications])

  return null
}
