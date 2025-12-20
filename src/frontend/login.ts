import { api } from './api'
import { showNotification } from './utils'

async function handleLogin(e?: Event): Promise<void> {
  if (!e) return
  e.preventDefault()

  const form = e.target as HTMLFormElement
  const username = (form.querySelector('#username') as HTMLInputElement).value
  const password = (form.querySelector('#password') as HTMLInputElement).value

  try {
    await api.auth.login(username, password)
    window.location.href = '/dashboard.html'
  } catch (error) {
    showNotification('Login failed: ' + (error as Error).message, 'error')
  }
}

function initLogin(): void {
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin)
  }
}

// Auto-redirect if already logged in
async function checkAlreadyLoggedIn(): Promise<void> {
  try {
    await api.auth.me()
    window.location.href = '/dashboard.html'
  } catch {
    // Not logged in, stay on login page
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initLogin()
    checkAlreadyLoggedIn()
  })
} else {
  initLogin()
  checkAlreadyLoggedIn()
}

// Export to window for HTML inline scripts
declare global {
  interface Window {
    handleLogin: typeof handleLogin
  }
}

window.handleLogin = handleLogin
