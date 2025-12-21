import { api } from './api'
import { checkAuth, showNotification, createModal, escapeHtml } from './utils'

async function loadTemplates(): Promise<void> {
  try {
    const data = await api.templates.list()
    const templates = data.templates || []

    if (templates.length === 0) {
      const grid = document.getElementById('templatesGrid')
      if (grid) {
        grid.innerHTML = '<p class="empty-state">No templates configured</p>'
      }
      return
    }

    const gridHtml = templates.map((template: any) => `
      <div class="template-card">
        <div class="template-header">
          <h3>${escapeHtml(template.displayName)}</h3>
          <span class="badge ${template.isSystem ? 'system' : ''}">
            ${template.isSystem ? 'System' : 'Custom'}
          </span>
        </div>
        <div class="template-body">
          <p class="template-description">${escapeHtml(template.description)}</p>
          <div class="template-commands">
            <div class="commands-label">Commands</div>
            ${template.commands ? `<code>${template.commands.length} command${template.commands.length !== 1 ? 's' : ''}</code>` : '<code>No commands</code>'}
          </div>
        </div>
        <div class="template-actions">
          <button class="btn btn-primary btn-sm" onclick="viewTemplate('${template.id || ''}')" ${!template.id ? 'disabled' : ''}>View</button>
          ${!template.isSystem ? `
            <button class="btn btn-secondary btn-sm" onclick="editTemplate('${template.id || ''}')" ${!template.id ? 'disabled' : ''}>Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTemplate('${template.id || ''}', '${escapeHtml(template.name)}')" ${!template.id ? 'disabled' : ''}>Delete</button>
          ` : ''}
        </div>
      </div>
    `).join('')

    const grid = document.getElementById('templatesGrid')
    if (grid) {
      grid.innerHTML = gridHtml
    }
  } catch (error) {
    showNotification('Failed to load templates: ' + (error as Error).message, 'error')
  }
}

async function viewTemplate(id: string): Promise<void> {
  if (!id || id.trim() === '') {
    showNotification('Invalid template ID', 'error')
    return
  }
  try {
    const data = await api.templates.get(id)
    const template = data.template

    const content = `
      <div class="template-details">
        <div class="detail-row">
          <span class="detail-label">Name</span>
          <span>${escapeHtml(template.displayName)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Description</span>
          <span>${escapeHtml(template.description)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span>
            <span class="badge ${template.isSystem ? 'system' : ''}">
              ${template.isSystem ? 'System' : 'Custom'}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Commands</span>
          <pre><code>${escapeHtml(JSON.stringify(template.commands, null, 2))}</code></pre>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pre-Deploy</span>
          <pre><code>${escapeHtml(JSON.stringify(template.preDeploy || [], null, 2))}</code></pre>
        </div>
        <div class="detail-row">
          <span class="detail-label">Post-Deploy</span>
          <pre><code>${escapeHtml(JSON.stringify(template.postDeploy || [], null, 2))}</code></pre>
        </div>
      </div>
    `

    createModal('Template Details', content)
  } catch (error) {
    showNotification('Failed to load template: ' + (error as Error).message, 'error')
  }
}

async function editTemplate(id: string): Promise<void> {
  if (!id || id.trim() === '') {
    showNotification('Invalid template ID', 'error')
    return
  }
  try {
    const data = await api.templates.get(id)
    const template = data.template

    const content = `
      <form id="editTemplateForm">
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input type="text" id="displayName" value="${escapeHtml(template.displayName)}" required>
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" required>${escapeHtml(template.description)}</textarea>
        </div>
        <div class="form-group">
          <label for="commands">Commands (JSON array)</label>
          <textarea id="commands" required>${JSON.stringify(template.commands, null, 2)}</textarea>
        </div>
        <div class="form-group">
          <label for="preDeploy">Pre-Deploy (JSON array)</label>
          <textarea id="preDeploy">${JSON.stringify(template.preDeploy || [], null, 2)}</textarea>
        </div>
        <div class="form-group">
          <label for="postDeploy">Post-Deploy (JSON array)</label>
          <textarea id="postDeploy">${JSON.stringify(template.postDeploy || [], null, 2)}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">Update Template</button>
      </form>
    `

    const modal = createModal('Edit Template', content)
    const form = modal.querySelector('#editTemplateForm') as HTMLFormElement

    if (form) {
      form.addEventListener('submit', async (e: Event) => {
        e.preventDefault()
        try {
          await api.templates.update(id, {
            displayName: (document.getElementById('displayName') as HTMLInputElement).value,
            description: (document.getElementById('description') as HTMLTextAreaElement).value,
            commands: JSON.parse((document.getElementById('commands') as HTMLTextAreaElement).value),
            preDeploy: JSON.parse((document.getElementById('preDeploy') as HTMLTextAreaElement).value || '[]'),
            postDeploy: JSON.parse((document.getElementById('postDeploy') as HTMLTextAreaElement).value || '[]')
          })
          showNotification('Template updated successfully', 'success')
          modal.remove()
          await loadTemplates()
        } catch (error) {
          showNotification('Failed to update template: ' + (error as Error).message, 'error')
        }
      })
    }
  } catch (error) {
    showNotification('Failed to edit template: ' + (error as Error).message, 'error')
  }
}

async function deleteTemplate(id: string, name: string): Promise<void> {
  if (!id || id.trim() === '') {
    showNotification('Invalid template ID', 'error')
    return
  }
  if (!confirm(`Are you sure you want to delete template "${name}"?`)) {
    return
  }

  try {
    await api.templates.delete(id)
    showNotification(`Template ${name} deleted`, 'success')
    await loadTemplates()
  } catch (error) {
    showNotification('Delete failed: ' + (error as Error).message, 'error')
  }
}

function showAddTemplateModal(): void {
  const content = `
    <form id="addTemplateForm">
      <div class="form-group">
        <label for="templateName">Template ID</label>
        <input type="text" id="templateName" required placeholder="my-custom-template">
      </div>
      <div class="form-group">
        <label for="displayName">Display Name</label>
        <input type="text" id="displayName" required placeholder="My Custom Template">
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" required placeholder="Description of this template"></textarea>
      </div>
      <div class="form-group">
        <label for="commands">Commands (JSON array)</label>
        <textarea id="commands" required>["cd $cf$", "git fetch origin $branch$", "git checkout $branch$"]</textarea>
      </div>
      <button type="submit" class="btn btn-primary">Create Template</button>
    </form>
  `

  const modal = createModal('Create Custom Template', content)
  const form = modal.querySelector('#addTemplateForm') as HTMLFormElement

  if (form) {
    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault()
      try {
        await api.templates.create({
          name: (document.getElementById('templateName') as HTMLInputElement).value,
          displayName: (document.getElementById('displayName') as HTMLInputElement).value,
          description: (document.getElementById('description') as HTMLTextAreaElement).value,
          commands: JSON.parse((document.getElementById('commands') as HTMLTextAreaElement).value)
        })
        showNotification('Template created successfully', 'success')
        modal.remove()
        await loadTemplates()
      } catch (error) {
        showNotification('Failed to create template: ' + (error as Error).message, 'error')
      }
    })
  }
}

async function initTemplates(): Promise<void> {
  try {
    await checkAuth()
    await loadTemplates()

    const addBtn = document.getElementById('addTemplateBtn')
    if (addBtn) {
      addBtn.addEventListener('click', showAddTemplateModal)
    }
  } catch (error) {
    showNotification('Templates initialization failed: ' + (error as Error).message, 'error')
  }
}

// Auto-init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTemplates)
} else {
  initTemplates()
}

// Export to window
declare global {
  interface Window {
    loadTemplates: typeof loadTemplates
    viewTemplate: typeof viewTemplate
    editTemplate: typeof editTemplate
    deleteTemplate: typeof deleteTemplate
    showAddTemplateModal: typeof showAddTemplateModal
  }
}

window.loadTemplates = loadTemplates
window.viewTemplate = viewTemplate
window.editTemplate = editTemplate
window.deleteTemplate = deleteTemplate
window.showAddTemplateModal = showAddTemplateModal
