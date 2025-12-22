import { api } from './api'
import { checkAuth, formatDate, showNotification } from './utils'

interface PM2Process {
  name: string
  pid: number
  status: string
  memory: number
  cpu: number
}

interface OverviewStats {
  totalRepositories: number
  activeDeployments: number
  pm2Online: number
  recentLogs: any[]
}

async function loadOverviewStats(): Promise<void> {
  try {
    const [reposData, logsData] = await Promise.all([
      api.repositories.list(),
      api.logs.list('', { limit: '10' })
    ])

    const repositories = reposData.repositories || []
    const logs = logsData.logs || []

    const activeDeployments = logs.filter((log: any) => log.status === 'running').length
    const pm2Online = logs.filter((log: any) => log.status === 'success').length

    const statsHtml = `
      <div class="overview-grid">
        <div class="overview-card">
          <div class="overview-label">Total Repositories</div>
          <div class="overview-value">${repositories.length}</div>
        </div>
        <div class="overview-card">
          <div class="overview-label">Active Deployments</div>
          <div class="overview-value">${activeDeployments}</div>
        </div>
        <div class="overview-card">
          <div class="overview-label">Recent Success</div>
          <div class="overview-value">${pm2Online}</div>
        </div>
      </div>
    `

    const statsContainer = document.getElementById('overview-stats')
    if (statsContainer) {
      statsContainer.innerHTML = statsHtml
    }
  } catch (error) {
    showNotification('Failed to load overview stats: ' + (error as Error).message, 'error')
  }
}

async function loadPM2Status(): Promise<void> {
  try {
    const data = await api.system.pm2()
    const processes = data.processes || []

    if (processes.length === 0) {
      const table = document.getElementById('pm2-table')
      if (table) {
        table.innerHTML = '<p class="empty-state">No PM2 processes running</p>'
      }
      return
    }

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Process Name</th>
            <th>PID</th>
            <th>Status</th>
            <th>Memory</th>
            <th>CPU</th>
          </tr>
        </thead>
        <tbody>
          ${processes.map((proc: PM2Process) => `
            <tr>
              <td><strong>${proc.name}</strong></td>
              <td>${proc.pid}</td>
              <td><span class="status ${proc.status}">${proc.status}</span></td>
              <td>${(proc.memory / 1024 / 1024).toFixed(2)} MB</td>
              <td>${proc.cpu}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    const table = document.getElementById('pm2-table')
    if (table) {
      table.innerHTML = tableHtml
    }
  } catch (error) {
    showNotification('Failed to load PM2 status: ' + (error as Error).message, 'error')
  }
}

async function loadRecentLogs(): Promise<void> {
  try {
    const data = await api.logs.list('', { limit: '10' })
    const logs = data.logs || []

    if (logs.length === 0) {
      const logsContainer = document.getElementById('recent-logs')
      if (logsContainer) {
        logsContainer.innerHTML = '<p class="empty-state">No deployment logs</p>'
      }
      return
    }

    const logsHtml = `
      <div class="logs-list">
        ${logs.map((log: any) => {
          return `
          <div class="log-item">
            <div class="log-header">
              <span class="log-repo">${log.repository}</span>
              <span class="status ${log.status}">${log.status}</span>
            </div>
            <div class="log-time">${formatDate(log.startedAt)}</div>
            <div class="log-branch">Branch: ${log.branch}</div>
          </div>
        `
        }).join('')}
      </div>
    `

    const logsContainer = document.getElementById('recent-logs')
    if (logsContainer) {
      logsContainer.innerHTML = logsHtml
    }
  } catch (error) {
    showNotification('Failed to load recent logs: ' + (error as Error).message, 'error')
  }
}

async function initDashboard(): Promise<void> {
  try {
    await checkAuth()
    await loadOverviewStats()
    await loadPM2Status()
    await loadRecentLogs()

    const refreshBtn = document.getElementById('refresh-btn')
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true
        try {
          await loadOverviewStats()
          await loadPM2Status()
          await loadRecentLogs()
          showNotification('Dashboard refreshed', 'success')
        } catch (error) {
          showNotification('Failed to refresh: ' + (error as Error).message, 'error')
        } finally {
          refreshBtn.disabled = false
        }
      })
    }
  } catch (error) {
    showNotification('Dashboard initialization failed: ' + (error as Error).message, 'error')
  }
}

// Auto-init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard)
} else {
  initDashboard()
}

// Export to window
declare global {
  interface Window {
    loadOverviewStats: typeof loadOverviewStats
    loadPM2Status: typeof loadPM2Status
    loadRecentLogs: typeof loadRecentLogs
  }
}

window.loadOverviewStats = loadOverviewStats
window.loadPM2Status = loadPM2Status
window.loadRecentLogs = loadRecentLogs
