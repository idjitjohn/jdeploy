import { api } from './api'
import { checkAuth, formatDate, showNotification, createModal, escapeHtml } from './utils'

async function loadDomains(): Promise<void> {
  try {
    const data = await api.domains.list()
    const domains = data.domains || []

    if (domains.length === 0) {
      const table = document.getElementById('domainsTable')
      if (table) {
        table.innerHTML = '<p class="empty-state">No domains configured</p>'
      }
      return
    }

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Domain Name</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${domains.map((domain: any) => `
            <tr>
              <td><strong>${escapeHtml(domain.name)}</strong></td>
              <td>${formatDate(domain.createdAt)}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="editDomain('${domain.id || ''}')" ${!domain.id ? 'disabled' : ''}>Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteDomain('${domain.id || ''}', '${escapeHtml(domain.name)}')" ${!domain.id ? 'disabled' : ''}>Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    const table = document.getElementById('domainsTable')
    if (table) {
      table.innerHTML = tableHtml
    }
  } catch (error) {
    showNotification('Failed to load domains: ' + (error as Error).message, 'error')
  }
}

async function editDomain(id: string): Promise<void> {
  if (!id || id.trim() === '') {
    showNotification('Invalid domain ID', 'error')
    return
  }
  try {
    const data = await api.domains.list()
    const domains = data.domains || []
    const domain = domains.find((d: any) => d.id === id)

    if (!domain) {
      showNotification('Domain not found', 'error')
      return
    }

    const content = `
      <div class="domain-editor">
        <div class="domain-info">
          <label>Domain Name</label>
          <p>${escapeHtml(domain.name)}</p>
        </div>

        <div class="editor-section">
          <div class="editor-header">
            <span>SSL Certificate (.crt)</span>
            <button type="button" class="btn btn-sm btn-secondary" id="editCertBtn">Edit</button>
          </div>
          <div id="certEditor" class="editor-content" style="display: none;">
            <textarea id="certificate" required placeholder="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----">${escapeHtml(domain.certificate || '')}</textarea>
            <button type="button" class="btn btn-sm btn-primary" id="saveCertBtn">Save</button>
          </div>
        </div>

        <div class="editor-section">
          <div class="editor-header">
            <span>Private Key (.key)</span>
            <button type="button" class="btn btn-sm btn-secondary" id="editKeyBtn">Edit</button>
          </div>
          <div id="keyEditor" class="editor-content" style="display: none;">
            <textarea id="privateKey" required placeholder="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----">${escapeHtml(domain.privateKey || '')}</textarea>
            <button type="button" class="btn btn-sm btn-primary" id="saveKeyBtn">Save</button>
          </div>
        </div>
      </div>
    `

    const modal = createModal('Edit Domain', content)

    const editCertBtn = modal.querySelector('#editCertBtn') as HTMLButtonElement
    const certEditor = modal.querySelector('#certEditor') as HTMLElement
    const saveCertBtn = modal.querySelector('#saveCertBtn') as HTMLButtonElement

    const editKeyBtn = modal.querySelector('#editKeyBtn') as HTMLButtonElement
    const keyEditor = modal.querySelector('#keyEditor') as HTMLElement
    const saveKeyBtn = modal.querySelector('#saveKeyBtn') as HTMLButtonElement

    editCertBtn?.addEventListener('click', () => {
      certEditor.style.display = certEditor.style.display === 'none' ? 'flex' : 'none'
    })

    saveCertBtn?.addEventListener('click', async () => {
      try {
        const certValue = (modal.querySelector('#certificate') as HTMLTextAreaElement).value
        await api.domains.delete(id)
        await api.domains.create({
          name: domain.name,
          certificate: certValue,
          privateKey: domain.privateKey
        })
        showNotification('Certificate updated successfully', 'success')
        modal.remove()
        await loadDomains()
      } catch (error) {
        showNotification('Failed to update certificate: ' + (error as Error).message, 'error')
      }
    })

    editKeyBtn?.addEventListener('click', () => {
      keyEditor.style.display = keyEditor.style.display === 'none' ? 'flex' : 'none'
    })

    saveKeyBtn?.addEventListener('click', async () => {
      try {
        const keyValue = (modal.querySelector('#privateKey') as HTMLTextAreaElement).value
        await api.domains.delete(id)
        await api.domains.create({
          name: domain.name,
          certificate: domain.certificate,
          privateKey: keyValue
        })
        showNotification('Private key updated successfully', 'success')
        modal.remove()
        await loadDomains()
      } catch (error) {
        showNotification('Failed to update private key: ' + (error as Error).message, 'error')
      }
    })
  } catch (error) {
    showNotification('Failed to edit domain: ' + (error as Error).message, 'error')
  }
}

async function deleteDomain(id: string, name: string): Promise<void> {
  if (!id || id.trim() === '') {
    showNotification('Invalid domain ID', 'error')
    return
  }
  if (!confirm(`Are you sure you want to delete domain "${name}"?`)) {
    return
  }

  try {
    await api.domains.delete(id)
    showNotification(`Domain ${name} deleted`, 'success')
    await loadDomains()
  } catch (error) {
    showNotification('Delete failed: ' + (error as Error).message, 'error')
  }
}

function showAddDomainModal(): void {
  const content = `
    <form id="addDomainForm">
      <div class="form-group">
        <label for="domainName">Domain Name</label>
        <input type="text" id="domainName" required placeholder="example.com">
      </div>
      <div class="form-group">
        <label for="certificate">SSL Certificate (.crt)</label>
        <textarea id="certificate" required placeholder="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"></textarea>
      </div>
      <div class="form-group">
        <label for="privateKey">Private Key (.key)</label>
        <textarea id="privateKey" required placeholder="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Add Domain</button>
    </form>
  `

  const modal = createModal('Add Domain', content)
  const form = modal.querySelector('#addDomainForm') as HTMLFormElement

  if (form) {
    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault()
      try {
        await api.domains.create({
          name: (document.getElementById('domainName') as HTMLInputElement).value,
          certificate: (document.getElementById('certificate') as HTMLTextAreaElement).value,
          privateKey: (document.getElementById('privateKey') as HTMLTextAreaElement).value
        })
        showNotification('Domain added successfully', 'success')
        modal.remove()
        await loadDomains()
      } catch (error) {
        showNotification('Failed to add domain: ' + (error as Error).message, 'error')
      }
    })
  }
}

async function initDomains(): Promise<void> {
  try {
    await checkAuth()
    await loadDomains()

    const addBtn = document.getElementById('addDomainBtn')
    if (addBtn) {
      addBtn.addEventListener('click', showAddDomainModal)
    }
  } catch (error) {
    showNotification('Domains initialization failed: ' + (error as Error).message, 'error')
  }
}

// Auto-init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDomains)
} else {
  initDomains()
}

// Export to window
declare global {
  interface Window {
    loadDomains: typeof loadDomains
    editDomain: typeof editDomain
    deleteDomain: typeof deleteDomain
    showAddDomainModal: typeof showAddDomainModal
  }
}

window.loadDomains = loadDomains
window.editDomain = editDomain
window.deleteDomain = deleteDomain
window.showAddDomainModal = showAddDomainModal
