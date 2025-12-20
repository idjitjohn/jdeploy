import { api } from './api'
import { checkAuth, formatDate, showNotification, createModal, escapeHtml } from './utils'

let repositories: any[] = []
let currentRepo: string | null = null

async function loadRepositories(): Promise<void> {
  try {
    const data = await api.repositories.list()
    repositories = data.repositories || []

    const repoFilter = document.getElementById('repoFilter') as HTMLSelectElement
    if (repoFilter) {
      repoFilter.innerHTML = '<option value="">Select repository...</option>' +
        repositories.map(repo => `<option value="${repo.name}">${repo.name}</option>`).join('')
    }
  } catch (error) {
    showNotification('Failed to load repositories: ' + (error as Error).message, 'error')
  }
}

async function loadLogs(): Promise<void> {
  const repoFilter = document.getElementById('repoFilter') as HTMLSelectElement
  const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement
  const repoName = repoFilter.value
  const status = statusFilter.value

  if (!repoName) {
    const logsTable = document.getElementById('logsTable')
    if (logsTable) {
      logsTable.innerHTML = '<div class="empty-state">Select a repository to view logs</div>'
    }
    return
  }

  currentRepo = repoName

  try {
    const query: any = {}
    if (status) query.status = status

    const data = await api.logs.list(repoName, query)
    const logs = data.logs || []

    const logsTable = document.getElementById('logsTable')
    if (!logsTable) return

    if (logs.length === 0) {
      logsTable.innerHTML = '<p class="empty-state">No deployment logs found</p>'
      return
    }

    logsTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Branch</th>
            <th>Type</th>
            <th>Status</th>
            <th>Triggered By</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map((log: any) => {
            const duration = log.completedAt && log.startedAt
              ? Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000) + 's'
              : 'N/A'

            return `
              <tr>
                <td>${formatDate(log.startedAt)}</td>
                <td><span class="badge badge-small">${escapeHtml(log.branch)}</span></td>
                <td><span class="badge badge-small">${escapeHtml(log.type)}</span></td>
                <td><span class="status ${log.status}">${log.status}</span></td>
                <td>${escapeHtml(log.triggeredBy)}</td>
                <td>${duration}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="viewLog('${log._id}')">View Details</button>
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `
  } catch (error) {
    showNotification('Failed to load logs: ' + (error as Error).message, 'error')
  }
}

async function viewLog(logId: string): Promise<void> {
  try {
    const data = await api.logs.get(logId)
    const log = data.log
    const content = data.content || 'No log content available'

    const duration = log.completedAt && log.startedAt
      ? Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000) + 's'
      : 'N/A'

    const modalContent = `
      <div class="repo-details">
        <div class="detail-row">
          <label>Repository:</label>
          <span>${escapeHtml(log.repository)}</span>
        </div>
        <div class="detail-row">
          <label>Branch:</label>
          <span>${escapeHtml(log.branch)}</span>
        </div>
        <div class="detail-row">
          <label>Status:</label>
          <span class="status ${log.status}">${log.status}</span>
        </div>
        <div class="detail-row">
          <label>Type:</label>
          <span>${escapeHtml(log.type)}</span>
        </div>
        <div class="detail-row">
          <label>Triggered By:</label>
          <span>${escapeHtml(log.triggeredBy)}</span>
        </div>
        <div class="detail-row">
          <label>Started:</label>
          <span>${formatDate(log.startedAt)}</span>
        </div>
        <div class="detail-row">
          <label>Completed:</label>
          <span>${formatDate(log.completedAt)}</span>
        </div>
        <div class="detail-row">
          <label>Duration:</label>
          <span>${duration}</span>
        </div>
        ${log.errorMessage ? `
          <div class="detail-row">
            <label>Error:</label>
            <span class="error-text">${escapeHtml(log.errorMessage)}</span>
          </div>
        ` : ''}
        <div class="detail-row">
          <label>Log Output:</label>
          <pre class="log-output">${escapeHtml(content)}</pre>
        </div>
      </div>
    `

    createModal('Deployment Log Details', modalContent)
  } catch (error) {
    showNotification('Failed to load log details: ' + (error as Error).message, 'error')
  }
}

async function initLogs(): Promise<void> {
  try {
    await checkAuth()
    await loadRepositories()

    const repoFilter = document.getElementById('repoFilter')
    const statusFilter = document.getElementById('statusFilter')

    if (repoFilter) {
      repoFilter.addEventListener('change', loadLogs)
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', loadLogs)
    }
  } catch (error) {
    showNotification('Logs initialization failed: ' + (error as Error).message, 'error')
  }
}

// Auto-init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogs)
} else {
  initLogs()
}

// Export to window
declare global {
  interface Window {
    loadRepositories: typeof loadRepositories
    loadLogs: typeof loadLogs
    viewLog: typeof viewLog
  }
}

window.loadRepositories = loadRepositories
window.loadLogs = loadLogs
window.viewLog = viewLog
