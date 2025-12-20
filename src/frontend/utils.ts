export async function checkAuth(): Promise<void> {
  try {
    await window.api.auth.me()
  } catch (error) {
    const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/index.html'
    if (!isLoginPage) {
      window.location.href = '/index.html'
    }
    throw error
  }
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString()
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  const notification = document.createElement('div')
  notification.className = `notification ${type}`
  notification.textContent = message
  notification.style.cssText = `
    position: fixed;
    top: 2em;
    right: 2em;
    padding: 1em 1.5em;
    background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#48bb78' : '#3498db'};
    color: white;
    border-radius: 0.5em;
    box-shadow: 0 0.25em 1em rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease'
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

export function createModal(title: string, content: string): HTMLElement {
  const modal = document.createElement('div')
  modal.className = 'modal'
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `

  const closeBtn = modal.querySelector('.modal-close') as HTMLElement
  const overlay = modal.querySelector('.modal-overlay') as HTMLElement

  closeBtn.addEventListener('click', () => {
    modal.remove()
  })

  overlay.addEventListener('click', () => {
    modal.remove()
  })

  document.body.appendChild(modal)

  return modal
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

declare global {
  interface Window {
    checkAuth: typeof checkAuth
    formatDate: typeof formatDate
    formatBytes: typeof formatBytes
    showNotification: typeof showNotification
    createModal: typeof createModal
    escapeHtml: typeof escapeHtml
  }
}

window.checkAuth = checkAuth
window.formatDate = formatDate
window.formatBytes = formatBytes
window.showNotification = showNotification
window.createModal = createModal
window.escapeHtml = escapeHtml
