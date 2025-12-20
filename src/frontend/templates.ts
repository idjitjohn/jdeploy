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

    const gridHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(20em, 1fr)); gap: 1.5em;">
        ${templates.map((template: any) => `
          <div class="card" style="margin: 0;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1em;">
              <h3 style="margin: 0;">${escapeHtml(template.displayName)}</h3>
              ${template.isSystem ? '<span class="badge" style="background: #667eea; color: white;">System</span>' : '<span class="badge">Custom</span>'}
            </div>
            <p style="color: #666; margin-bottom: 1em;">${escapeHtml(template.description)}</p>
            <div style="margin-bottom: 1em;">
              <strong>Commands:</strong> ${template.commands ? template.commands.length : 0}
            </div>
            <div style="display: flex; gap: 0.5em;">
              <button class="btn btn-sm btn-info" onclick="viewTemplate('${template._id}')">View</button>
              ${!template.isSystem ? `
                <button class="btn btn-sm btn-warning" onclick="editTemplate('${template._id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTemplate('${template._id}', '${template.name}')">Delete</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `

    const grid = document.getElementById('templatesGrid')
    if (grid) {
      grid.innerHTML = gridHtml
    }
  } catch (error) {
    showNotification('Failed to load templates: ' + (error as Error).message, 'error')
  }
}

async function viewTemplate(id: string): Promise<void> {
  try {
    const data = await api.templates.get(id)
    const template = data.template

    const content = `
      <div class="repo-details">
        <div class="detail-row">
          <label>Name:</label>
          <span>${escapeHtml(template.displayName)}</span>
        </div>
        <div class="detail-row">
          <label>Description:</label>
          <span>${escapeHtml(template.description)}</span>
        </div>
        <div class="detail-row">
          <label>Type:</label>
          <span>${template.isSystem ? 'System' : 'Custom'}</span>
        </div>
        <div class="detail-row">
          <label>Commands:</label>
          <pre>${JSON.stringify(template.commands, null, 2)}</pre>
        </div>
        <div class="detail-row">
          <label>Pre-Deploy:</label>
          <pre>${JSON.stringify(template.preDeploy || [], null, 2)}</pre>
        </div>
        <div class="detail-row">
          <label>Post-Deploy:</label>
          <pre>${JSON.stringify(template.postDeploy || [], null, 2)}</pre>
        </div>
      </div>
    `

    createModal('Template Details', content)
  } catch (error) {
    showNotification('Failed to load template: ' + (error as Error).message, 'error')
  }
}

async function editTemplate(id: string): Promise<void> {
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
