import { api } from './api'
import { checkAuth, formatDate, showNotification, createModal, escapeHtml } from './utils'

async function loadRepositories(): Promise<void> {
  try {
    const data = await api.repositories.list()
    const repositories = data.repositories || []

    if (repositories.length === 0) {
      const table = document.getElementById('repositories-table')
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
                <button class="btn btn-sm btn-secondary" onclick="editRepository('${repo.id || ''}')" ${!repo.id ? 'disabled' : ''}>Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteRepository('${repo.id || ''}', '${escapeHtml(repo.name)}')" ${!repo.id ? 'disabled' : ''}>Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    const table = document.getElementById('repositories-table')
    if (table) {
      table.innerHTML = tableHtml
    }
  } catch (error) {
    showNotification('Failed to load repositories: ' + (error as Error).message, 'error')
  }
}

async function editRepository(id: string): Promise<void> {
  if (!id || id.trim() === '') {
    showNotification('Invalid repository ID', 'error')
    return
  }
  try {
    const data = await api.repositories.get(id)
    const repo = data.repository

    const content = `
      <form id="edit-repo-form">
        <div class="form-group">
          <label for="repo-name">Application Name</label>
          <input type="text" id="repo-name" value="${escapeHtml(repo.name)}" required>
        </div>
        <div class="form-group">
          <label for="repo-url">Repository URL</label>
          <input type="text" id="repo-url" value="${escapeHtml(repo.repoUrl)}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="domain">Domain</label>
            <select id="domain" required>
              <option value="">Select a domain...</option>
            </select>
          </div>
          <div class="form-group">
            <label for="port">Port</label>
            <input type="number" id="port" value="${repo.port || ''}" required placeholder="3000" min="1" max="65535">
          </div>
        </div>
        <div class="envs-section">
          <div class="envs-header">
            <h3>Envs</h3>
            <button type="button" id="add-env-btn" class="btn btn-secondary btn-sm">+ Add Env</button>
          </div>
          <div id="envs-list" class="envs-grid"></div>
        </div>
        <button type="submit" class="btn btn-primary">Update Application</button>
      </form>
    `

    const modal = createModal('Edit Application', content)
    const domainSelect = modal.querySelector('#domain') as HTMLSelectElement
    const form = modal.querySelector('#edit-repo-form') as HTMLFormElement
    const addEnvBtn = modal.querySelector('#add-env-btn') as HTMLButtonElement
    const envsList = modal.querySelector('#envs-list') as HTMLDivElement

    let envIndex = 0
    const envs: any = {}

    function editEnv(index: number): void {
      const env = envs[index] || { name: '', type: '', pm2Name: '' }

      const editContent = `
        <div class="env-edit-form">
          <div class="form-group">
            <label>Env Name</label>
            <input type="text" id="env-name" value="${escapeHtml(env.name)}" placeholder="main" required>
          </div>
          <div class="form-group">
            <label>Environment Type</label>
            <select id="env-type" required>
              <option value="">Select type...</option>
              <option value="prod" ${env.type === 'prod' ? 'selected' : ''}>Production</option>
              <option value="staging" ${env.type === 'staging' ? 'selected' : ''}>Staging</option>
              <option value="dev" ${env.type === 'dev' ? 'selected' : ''}>Development</option>
            </select>
          </div>
          <div class="form-group">
            <label>PM2 Process Name</label>
            <input type="text" id="env-pm2" value="${escapeHtml(env.pm2Name)}" placeholder="app-main" required>
          </div>
        </div>
        <div class="env-edit-actions">
          <button type="button" class="btn btn-danger" id="delete-env-btn">Delete</button>
          <button type="button" class="btn btn-primary" id="save-env-btn">Save</button>
        </div>
      `

      const envModal = createModal('Edit Env', editContent)
      const saveBtn = envModal.querySelector('#save-env-btn') as HTMLButtonElement
      const deleteBtn = envModal.querySelector('#delete-env-btn') as HTMLButtonElement

      saveBtn?.addEventListener('click', () => {
        const nameInput = envModal.querySelector('#env-name') as HTMLInputElement
        const typeSelect = envModal.querySelector('#env-type') as HTMLSelectElement
        const pm2Input = envModal.querySelector('#env-pm2') as HTMLInputElement

        if (nameInput.value && typeSelect.value && pm2Input.value) {
          envs[index] = {
            name: nameInput.value,
            type: typeSelect.value,
            pm2Name: pm2Input.value
          }
          addEnvBlock(index)
          envModal.remove()
        }
      })

      deleteBtn?.addEventListener('click', () => {
        delete envs[index]
        const existingBlock = document.querySelector(`[data-env-index="${index}"]`)
        if (existingBlock) {
          existingBlock.remove()
        }
        updateEmptyState()
        envModal.remove()
      })
    }

    function updateEmptyState(): void {
      const emptyState = envsList.querySelector('.envs-empty-state')
      const hasEnvs = Object.keys(envs).length > 0

      if (hasEnvs && emptyState) {
        emptyState.remove()
      } else if (!hasEnvs && !emptyState) {
        const emptyDiv = document.createElement('p')
        emptyDiv.className = 'envs-empty-state'
        emptyDiv.textContent = 'No environments configured. Click + Add Env to create one.'
        envsList.appendChild(emptyDiv)
      }
    }

    function addEnvBlock(index: number): void {
      const env = envs[index]
      const existingBlock = document.querySelector(`[data-env-index="${index}"]`)

      if (existingBlock) {
        existingBlock.remove()
      }

      const envBlock = document.createElement('div')
      envBlock.className = 'env-card'
      envBlock.setAttribute('data-env-index', index.toString())
      envBlock.innerHTML = `
        <div class="env-card-header">
          <strong>${escapeHtml(env.name)}</strong>
          <span class="env-card-type-badge">${escapeHtml(env.type)}</span>
        </div>
        <div class="env-card-details">
          <small>PM2: ${escapeHtml(env.pm2Name)}</small>
        </div>
      `
      envBlock.addEventListener('click', () => editEnv(index))

      envsList.appendChild(envBlock)
      updateEmptyState()
    }

    addEnvBtn?.addEventListener('click', (e: Event) => {
      e.preventDefault()
      const newIndex = envIndex++
      envs[newIndex] = { name: '', type: '', pm2Name: '' }
      editEnv(newIndex)
    })

    // Load existing branches as envs
    if (repo.branches && Object.keys(repo.branches).length > 0) {
      Object.entries(repo.branches).forEach(([branchName, branchData]: [string, any]) => {
        const index = envIndex++
        envs[index] = {
          name: branchName,
          type: branchData.type,
          pm2Name: branchData.pm2Name
        }
        addEnvBlock(index)
      })
    } else {
      updateEmptyState()
    }

    // Load domains
    api.domains.list()
      .then((domainsData: any) => {
        const domains = domainsData.domains || []
        domains.forEach((domain: any) => {
          const option = document.createElement('option')
          option.value = domain.name
          option.textContent = domain.name
          if (domain.name === repo.domain) {
            option.selected = true
          }
          domainSelect.appendChild(option)
        })
      })
      .catch(() => {
        showNotification('Failed to load domains', 'error')
      })

    if (form) {
      form.addEventListener('submit', async (e: Event) => {
        e.preventDefault()
        try {
          const branches: any = {}
          Object.values(envs).forEach((env: any) => {
            if (env.name && env.type && env.pm2Name) {
              branches[env.name] = {
                type: env.type,
                pm2Name: env.pm2Name,
                preDeploy: [],
                postDeploy: []
              }
            }
          })

          await api.repositories.update(id, {
            name: (document.getElementById('repo-name') as HTMLInputElement).value,
            repoUrl: (document.getElementById('repo-url') as HTMLInputElement).value,
            domain: (document.getElementById('domain') as HTMLSelectElement).value,
            port: parseInt((document.getElementById('port') as HTMLInputElement).value, 10),
            branches: branches
          })
          showNotification('Application updated successfully', 'success')
          modal.remove()
          await loadRepositories()
        } catch (error) {
          showNotification('Failed to update application: ' + (error as Error).message, 'error')
        }
      })
    }
  } catch (error) {
    showNotification('Failed to edit application: ' + (error as Error).message, 'error')
  }
}

async function deleteRepository(id: string, name: string): Promise<void> {
  if (!id || id.trim() === '') {
    showNotification('Invalid repository ID', 'error')
    return
  }
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
    <form id="add-repo-form">
      <div class="form-group">
        <label for="repo-name">Application Name</label>
        <input type="text" id="repo-name" required placeholder="my-project">
      </div>
      <div class="form-group">
        <label for="repo-url">Repository URL</label>
        <input type="text" id="repo-url" required placeholder="https://github.com/user/repo.git">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="domain">Domain</label>
          <select id="domain" required>
            <option value="">Select a domain...</option>
          </select>
        </div>
        <div class="form-group">
          <label for="port">Port</label>
          <input type="number" id="port" required placeholder="3000" min="1" max="65535">
        </div>
      </div>
      <div class="form-group">
        <label for="template">Template</label>
        <select id="template" required>
          <option value="">Select a template...</option>
        </select>
      </div>
      <div class="envs-section">
        <div class="envs-header">
          <h3>Envs</h3>
          <button type="button" id="add-env-btn" class="btn btn-secondary btn-sm">+ Add Env</button>
        </div>
        <div id="envs-list" class="envs-grid"></div>
      </div>
      <button type="submit" class="btn btn-primary">Create Application</button>
    </form>
  `

  const modal = createModal('Add Application', content)
  const domainSelect = modal.querySelector('#domain') as HTMLSelectElement
  const templateSelect = modal.querySelector('#template') as HTMLSelectElement
  const form = modal.querySelector('#add-repo-form') as HTMLFormElement
  const addEnvBtn = modal.querySelector('#add-env-btn') as HTMLButtonElement
  const envsList = modal.querySelector('#envs-list') as HTMLDivElement

  let envIndex = 0
  const envs: any = {}

  // Load domains
  api.domains.list()
    .then((domainsData: any) => {
      const domains = domainsData.domains || []
      domains.forEach((domain: any) => {
        const option = document.createElement('option')
        option.value = domain.name
        option.textContent = domain.name
        domainSelect.appendChild(option)
      })
    })
    .catch(() => {
      showNotification('Failed to load domains', 'error')
    })


  function updateEmptyState(): void {
    const emptyState = envsList.querySelector('.envs-empty-state')
    const hasEnvs = Object.keys(envs).length > 0

    if (hasEnvs && emptyState) {
      emptyState.remove()
    } else if (!hasEnvs && !emptyState) {
      const emptyDiv = document.createElement('p')
      emptyDiv.className = 'envs-empty-state'
      emptyDiv.textContent = 'No environments configured. Click + Add Env to create one.'
      envsList.appendChild(emptyDiv)
    }
  }

  function editEnv(index: number): void {
    const env = envs[index] || { name: '', type: '', pm2Name: '' }

    const editContent = `
      <div class="env-edit-form">
        <div class="form-group">
          <label>Branch Name</label>
          <input type="text" class="env-form-name" value="${env.name ? escapeHtml(env.name) : ''}" placeholder="main" required>
        </div>
        <div class="form-group">
          <label>Environment Type</label>
          <select class="env-form-type" required>
            <option value="">Select type...</option>
            <option value="prod" ${env.type === 'prod' ? 'selected' : ''}>Production</option>
            <option value="staging" ${env.type === 'staging' ? 'selected' : ''}>Staging</option>
            <option value="dev" ${env.type === 'dev' ? 'selected' : ''}>Development</option>
          </select>
        </div>
        <div class="form-group">
          <label>PM2 Process Name</label>
          <input type="text" class="env-form-pm2" value="${env.pm2Name ? escapeHtml(env.pm2Name) : ''}" placeholder="app-main" required>
        </div>
        <div class="env-edit-actions">
          <button type="button" class="btn btn-primary env-edit-save">Save</button>
          <button type="button" class="btn btn-danger env-edit-delete">Delete</button>
        </div>
      </div>
    `

    const editModal = createModal(index in envs ? 'Edit Env' : 'Add Env', editContent)
    const saveBtn = editModal.querySelector('.env-edit-save') as HTMLButtonElement
    const deleteBtn = editModal.querySelector('.env-edit-delete') as HTMLButtonElement

    saveBtn?.addEventListener('click', () => {
      const name = (editModal.querySelector('.env-form-name') as HTMLInputElement).value
      const type = (editModal.querySelector('.env-form-type') as HTMLSelectElement).value
      const pm2Name = (editModal.querySelector('.env-form-pm2') as HTMLInputElement).value

      if (name && type && pm2Name) {
        envs[index] = { name, type, pm2Name }
        addEnvBlock(index)
        editModal.remove()
      } else {
        showNotification('Please fill in all fields', 'error')
      }
    })

    deleteBtn?.addEventListener('click', () => {
      delete envs[index]
      const block = document.querySelector(`[data-env-index="${index}"]`)
      if (block) {
        block.remove()
      }
      updateEmptyState()
      editModal.remove()
    })
  }

  function addEnvBlock(index: number): void {
    const env = envs[index]
    const existingBlock = document.querySelector(`[data-env-index="${index}"]`)

    if (existingBlock) {
      existingBlock.remove()
    }

    const envBlock = document.createElement('div')
    envBlock.className = 'env-card'
    envBlock.setAttribute('data-env-index', index.toString())
    envBlock.innerHTML = `
      <div class="env-card-header">
        <strong>${escapeHtml(env.name)}</strong>
        <span class="env-card-type-badge">${escapeHtml(env.type)}</span>
      </div>
      <div class="env-card-details">
        <small>PM2: ${escapeHtml(env.pm2Name)}</small>
      </div>
    `
    envBlock.addEventListener('click', () => editEnv(index))

    envsList.appendChild(envBlock)
    updateEmptyState()
  }

  addEnvBtn?.addEventListener('click', (e: Event) => {
    e.preventDefault()
    const newIndex = envIndex++
    envs[newIndex] = { name: '', type: '', pm2Name: '' }
    editEnv(newIndex)
  })

  // Show initial empty state
  updateEmptyState()

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
        const branches: any = {}
        Object.values(envs).forEach((env: any) => {
          if (env.name && env.type && env.pm2Name) {
            branches[env.name] = {
              type: env.type,
              pm2Name: env.pm2Name,
              preDeploy: [],
              postDeploy: []
            }
          }
        })

        await api.repositories.create({
          name: (document.getElementById('repo-name') as HTMLInputElement).value,
          repoUrl: (document.getElementById('repo-url') as HTMLInputElement).value,
          domain: (document.getElementById('domain') as HTMLSelectElement).value,
          port: parseInt((document.getElementById('port') as HTMLInputElement).value, 10),
          template: (document.getElementById('template') as HTMLSelectElement).value,
          branches: branches
        })
        showNotification('Application created successfully', 'success')
        modal.remove()
        await loadRepositories()
      } catch (error) {
        showNotification('Failed to create application: ' + (error as Error).message, 'error')
      }
    })
  }
}

async function initRepositories(): Promise<void> {
  try {
    await checkAuth()
    await loadRepositories()

    const addBtn = document.getElementById('add-repository-btn')
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
    editRepository: typeof editRepository
    deleteRepository: typeof deleteRepository
    showAddRepositoryModal: typeof showAddRepositoryModal
  }
}

window.loadRepositories = loadRepositories
window.editRepository = editRepository
window.deleteRepository = deleteRepository
window.showAddRepositoryModal = showAddRepositoryModal
