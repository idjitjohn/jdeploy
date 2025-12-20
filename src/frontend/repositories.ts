import { api } from './api'
import { checkAuth, formatDate, showNotification, createModal, escapeHtml } from './utils'

async function loadRepositories(): Promise<void> {
  try {
    const data = await api.repositories.list()
    const repositories = data.repositories || []

    if (repositories.length === 0) {
      const table = document.getElementById('repositoriesTable')
      if (table) {
        table.innerHTML = '<p class="empty-state">No repositories configured</p>'
      }
      return
    }

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Domain</th>
            <th>Port</th>
            <th>Branches</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${repositories.map((repo: any) => `
            <tr>
              <td><strong>${escapeHtml(repo.name)}</strong></td>
              <td>${escapeHtml(repo.domain || 'N/A')}</td>
              <td>${escapeHtml(repo.port || 'N/A')}</td>
              <td>${repo.branches ? Object.keys(repo.branches).length : 0}</td>
              <td>${formatDate(repo.createdAt)}</td>
              <td>
                <button class="btn btn-sm btn-info" onclick="viewRepository('${repo._id}')">View</button>
                <button class="btn btn-sm btn-warning" onclick="editRepository('${repo._id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteRepository('${repo._id}', '${repo.name}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    const table = document.getElementById('repositoriesTable')
    if (table) {
      table.innerHTML = tableHtml
    }
  } catch (error) {
    showNotification('Failed to load repositories: ' + (error as Error).message, 'error')
  }
}

async function viewRepository(id: string): Promise<void> {
  try {
    const data = await api.repositories.get(id)
    const repo = data.repository

    const content = `
      <div class="repo-details">
        <div class="detail-row">
          <label>Name:</label>
          <span>${escapeHtml(repo.name)}</span>
        </div>
        <div class="detail-row">
          <label>Repository URL:</label>
          <span>${escapeHtml(repo.repoUrl)}</span>
        </div>
        <div class="detail-row">
          <label>Domain:</label>
          <span>${escapeHtml(repo.domain || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Port:</label>
          <span>${escapeHtml(repo.port || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Template:</label>
          <span>${escapeHtml(repo.template || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Branches (${Object.keys(repo.branches || {}).length}):</label>
          <div>
            ${Object.entries(repo.branches || {}).map(([name, config]: any) => `
              <div class="branch-item">
                <strong>${escapeHtml(name)}</strong> - Type: ${config.type}, PM2: ${config.pm2Name}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `

    createModal('Repository Details', content)
  } catch (error) {
    showNotification('Failed to load repository: ' + (error as Error).message, 'error')
  }
}

async function editRepository(id: string): Promise<void> {
  try {
    const data = await api.repositories.get(id)
    const repo = data.repository

    const content = `
      <form id="editRepoForm">
        <div class="form-group">
          <label for="repoName">Repository Name</label>
          <input type="text" id="repoName" value="${escapeHtml(repo.name)}" disabled>
        </div>
        <div class="form-group">
          <label for="repoUrl">Repository URL</label>
          <input type="text" id="repoUrl" value="${escapeHtml(repo.repoUrl)}" required>
        </div>
        <div class="form-group">
          <label for="domain">Domain</label>
          <input type="text" id="domain" value="${escapeHtml(repo.domain || '')}" placeholder="example.com">
        </div>
        <div class="form-group">
          <label for="port">Port</label>
          <input type="text" id="port" value="${escapeHtml(repo.port || '')}" placeholder="3000">
        </div>
        <button type="submit" class="btn btn-primary">Update Repository</button>
      </form>
    `

    const modal = createModal('Edit Repository', content)
    const form = modal.querySelector('#editRepoForm') as HTMLFormElement
    if (form) {
      form.addEventListener('submit', async (e: Event) => {
        e.preventDefault()
        try {
          await api.repositories.update(id, {
            repoUrl: (document.getElementById('repoUrl') as HTMLInputElement).value,
            domain: (document.getElementById('domain') as HTMLInputElement).value,
            port: (document.getElementById('port') as HTMLInputElement).value
          })
          showNotification('Repository updated successfully', 'success')
          modal.remove()
          await loadRepositories()
        } catch (error) {
          showNotification('Failed to update repository: ' + (error as Error).message, 'error')
        }
      })
    }
  } catch (error) {
    showNotification('Failed to edit repository: ' + (error as Error).message, 'error')
  }
}

async function deleteRepository(id: string, name: string): Promise<void> {
  if (!confirm(`Are you sure you want to delete repository "${name}"?`)) {
    return
  }

  try {
    await api.repositories.delete(id)
    showNotification(`Repository ${name} deleted`, 'success')
    await loadRepositories()
  } catch (error) {
    showNotification('Delete failed: ' + (error as Error).message, 'error')
  }
}

function showAddRepositoryModal(): void {
  const content = `
    <form id="addRepoForm">
      <div class="form-group">
        <label for="repoName">Repository Name</label>
        <input type="text" id="repoName" required placeholder="my-project">
      </div>
      <div class="form-group">
        <label for="repoUrl">Repository URL</label>
        <input type="text" id="repoUrl" required placeholder="https://github.com/user/repo.git">
      </div>
      <div class="form-group">
        <label for="domain">Domain</label>
        <input type="text" id="domain" placeholder="example.com">
      </div>
      <div class="form-group">
        <label for="port">Port</label>
        <input type="text" id="port" placeholder="3000">
      </div>
      <div class="form-group">
        <label for="template">Template</label>
        <select id="template" required>
          <option value="">Select a template...</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Create Repository</button>
    </form>
  `

  const modal = createModal('Add Repository', content)
  const templateSelect = modal.querySelector('#template') as HTMLSelectElement
  const form = modal.querySelector('#addRepoForm') as HTMLFormElement

  // Load templates
  api.templates.list()
    .then((data: any) => {
      const templates = data.templates || []
      templates.forEach((template: any) => {
        const option = document.createElement('option')
        option.value = template.id
        option.textContent = template.displayName
        templateSelect.appendChild(option)
      })
    })
    .catch(() => {
      showNotification('Failed to load templates', 'error')
    })

  if (form) {
    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault()
      try {
        await api.repositories.create({
          name: (document.getElementById('repoName') as HTMLInputElement).value,
          repoUrl: (document.getElementById('repoUrl') as HTMLInputElement).value,
          domain: (document.getElementById('domain') as HTMLInputElement).value,
          port: (document.getElementById('port') as HTMLInputElement).value,
          template: (document.getElementById('template') as HTMLSelectElement).value
        })
        showNotification('Repository created successfully', 'success')
        modal.remove()
        await loadRepositories()
      } catch (error) {
        showNotification('Failed to create repository: ' + (error as Error).message, 'error')
      }
    })
  }
}

async function initRepositories(): Promise<void> {
  try {
    await checkAuth()
    await loadRepositories()

    const addBtn = document.getElementById('addRepositoryBtn')
    if (addBtn) {
      addBtn.addEventListener('click', showAddRepositoryModal)
    }
  } catch (error) {
    showNotification('Repositories initialization failed: ' + (error as Error).message, 'error')
  }
}

// Auto-init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRepositories)
} else {
  initRepositories()
}

// Export to window
declare global {
  interface Window {
    loadRepositories: typeof loadRepositories
    viewRepository: typeof viewRepository
    editRepository: typeof editRepository
    deleteRepository: typeof deleteRepository
    showAddRepositoryModal: typeof showAddRepositoryModal
  }
}

window.loadRepositories = loadRepositories
window.viewRepository = viewRepository
window.editRepository = editRepository
window.deleteRepository = deleteRepository
window.showAddRepositoryModal = showAddRepositoryModal
