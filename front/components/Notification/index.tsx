import { createRoot, Root } from 'react-dom/client'
import './Notification.scss'

type NotificationType = 'info' | 'success' | 'error'

interface NotificationData {
  id: number
  message: string
  type: NotificationType
  hiding?: boolean
}

let container: HTMLDivElement | null = null
let root: Root | null = null
let notifications: NotificationData[] = []
let idCounter = 0

function NotificationItem({ message, type, hiding }: { message: string; type: NotificationType; hiding?: boolean }) {
  return (
    <div className={`Notification ${type}${hiding ? ' hiding' : ''}`}>
      {message}
    </div>
  )
}

function NotificationContainer() {
  return (
    <>
      {notifications.map((n) => (
        <NotificationItem key={n.id} message={n.message} type={n.type} hiding={n.hiding} />
      ))}
    </>
  )
}

function render() {
  if (!container) {
    container = document.createElement('div')
    container.id = 'notification-container'
    container.classList.add('NotificationContainer')
    document.body.appendChild(container)
    root = createRoot(container)
  }
  const height = (document.querySelector('.Header') as HTMLDivElement)?.offsetHeight || 0
  container.style.top = height + 'px'
  root?.render(<NotificationContainer />)
}

export function showNotification(message: string, type: NotificationType = 'info'): void {
  const id = ++idCounter
  notifications.push({ id, message, type })
  render()

  setTimeout(() => {
    const idx = notifications.findIndex(n => n.id === id)
    if (idx !== -1) {
      notifications[idx].hiding = true
      render()
      setTimeout(() => {
        notifications = notifications.filter(n => n.id !== id)
        render()
      }, 300)
    }
  }, 3000)
}
