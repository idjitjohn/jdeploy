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
            <th>Certificate Path</th>
            <th>Private Key Path</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${domains.map((domain: any) => `
            <tr>
              <td><strong>${escapeHtml(domain.name)}</strong></td>
              <td><code>${escapeHtml(domain.certificatePath)}</code></td>
              <td><code>${escapeHtml(domain.privateKeyPath)}</code></td>
              <td>${formatDate(domain.createdAt)}</td>
              <td>
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
    deleteDomain: typeof deleteDomain
    showAddDomainModal: typeof showAddDomainModal
  }
}

window.loadDomains = loadDomains
window.deleteDomain = deleteDomain
window.showAddDomainModal = showAddDomainModal
