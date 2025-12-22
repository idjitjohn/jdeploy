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

    const gridHtml = templates.map((template: any) => {
      const commandsList = template.commands && Array.isArray(template.commands)
        ? template.commands.slice(0, 3).map((cmd: string) => `<code>${escapeHtml(cmd)}</code>`).join('')
        : ''
      const hasMore = template.commands && template.commands.length > 3

      return `
      <div class="template-card">
        <div class="template-header">
          <h3>${escapeHtml(template.displayName)}</h3>
          <span class="badge ${template.isSystem ? 'system' : ''}">
            ${template.isSystem ? 'System' : 'Custom'}
          </span>
        </div>
        <div class="template-body">
          <p class="template-description">${escapeHtml(template.description)}</p>
          ${commandsList ? `
          <div class="template-commands">
            <div class="commands-label">Commands</div>
            <div class="commands-list">
              ${commandsList}
              ${hasMore ? `<span class="commands-more">+${template.commands.length - 3} more</span>` : ''}
            </div>
          </div>
          ` : '<div class="template-commands"><span class="no-commands">No commands</span></div>'}
        </div>
        <div class="template-actions">
          <button class="btn btn-primary btn-sm" onclick="viewTemplate('${template.id || ''}')" ${!template.id ? 'disabled' : ''}>View</button>
          ${!template.isSystem ? `
            <button class="btn btn-secondary btn-sm" onclick="editTemplate('${template.id || ''}')" ${!template.id ? 'disabled' : ''}>Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTemplate('${template.id || ''}', '${escapeHtml(template.name)}')" ${!template.id ? 'disabled' : ''}>Delete</button>
          ` : ''}
        </div>
      </div>
    `
    }).join('')

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

    const commandsHtml = (template.commands || []).map((cmd: string, i: number) =>
      `<div class="command-line" data-editable="${!template.isSystem}">
        <div class="command-display" onclick="${!template.isSystem ? 'makeEditable(this)' : ''}">${escapeHtml(cmd)}</div>
        <input type="text" value="${escapeHtml(cmd)}" data-index="${i}" data-type="commands" style="display: none;">
        ${!template.isSystem ? `<button class="btn-remove" onclick="removeCommandLine(this)" title="Remove">&times;</button>` : ''}
      </div>`
    ).join('')

    const preDeployHtml = (template.preDeploy || []).map((cmd: string, i: number) =>
      `<div class="command-line" data-editable="${!template.isSystem}">
        <div class="command-display" onclick="${!template.isSystem ? 'makeEditable(this)' : ''}">${escapeHtml(cmd)}</div>
        <input type="text" value="${escapeHtml(cmd)}" data-index="${i}" data-type="preDeploy" style="display: none;">
        ${!template.isSystem ? `<button class="btn-remove" onclick="removeCommandLine(this)" title="Remove">&times;</button>` : ''}
      </div>`
    ).join('')

    const postDeployHtml = (template.postDeploy || []).map((cmd: string, i: number) =>
      `<div class="command-line" data-editable="${!template.isSystem}">
        <div class="command-display" onclick="${!template.isSystem ? 'makeEditable(this)' : ''}">${escapeHtml(cmd)}</div>
        <input type="text" value="${escapeHtml(cmd)}" data-index="${i}" data-type="postDeploy" style="display: none;">
        ${!template.isSystem ? `<button class="btn-remove" onclick="removeCommandLine(this)" title="Remove">&times;</button>` : ''}
      </div>`
    ).join('')

    const content = `
      <form id="view-template-form" class="template-details">
        <div class="detail-row">
          <span class="detail-label">Display Name</span>
          <div class="field-editable" data-editable="${!template.isSystem}">
            <div class="field-display" onclick="${!template.isSystem ? 'makeFieldEditable(this)' : ''}">${escapeHtml(template.displayName)}</div>
            <input type="text" id="view-display-name" value="${escapeHtml(template.displayName)}" style="display: none;">
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Description</span>
          <div class="field-editable" data-editable="${!template.isSystem}">
            <div class="field-display" onclick="${!template.isSystem ? 'makeFieldEditable(this)' : ''}">${escapeHtml(template.description)}</div>
            <textarea id="view-description" style="display: none;">${escapeHtml(template.description)}</textarea>
          </div>
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
          <div class="commands-editor" id="commands-list">
            ${commandsHtml || '<div class="no-commands">No commands</div>'}
          </div>
          ${!template.isSystem ? `<button type="button" class="btn btn-secondary btn-sm" onclick="addCommandLine('commands')">+ Add Command</button>` : ''}
        </div>
        <div class="detail-row">
          <span class="detail-label">Pre-Deploy</span>
          <div class="commands-editor" id="preDeploy-list">
            ${preDeployHtml || '<div class="no-commands">No pre-deploy commands</div>'}
          </div>
          ${!template.isSystem ? `<button type="button" class="btn btn-secondary btn-sm" onclick="addCommandLine('preDeploy')">+ Add Pre-Deploy</button>` : ''}
        </div>
        <div class="detail-row">
          <span class="detail-label">Post-Deploy</span>
          <div class="commands-editor" id="postDeploy-list">
            ${postDeployHtml || '<div class="no-commands">No post-deploy commands</div>'}
          </div>
          ${!template.isSystem ? `<button type="button" class="btn btn-secondary btn-sm" onclick="addCommandLine('postDeploy')">+ Add Post-Deploy</button>` : ''}
        </div>
        ${!template.isSystem ? '<button type="submit" class="btn btn-primary">Save Changes</button>' : ''}
      </form>
    `

    const modal = createModal(template.isSystem ? 'Template Details' : 'Edit Template', content)

    if (!template.isSystem) {
      const form = modal.querySelector('#view-template-form') as HTMLFormElement
      if (form) {
        form.addEventListener('submit', async (e: Event) => {
          e.preventDefault()
          try {
            const commands = Array.from(modal.querySelectorAll('#commands-list input[data-type="commands"]'))
              .map((input: any) => input.value.trim())
              .filter((v: string) => v.length > 0)

            const preDeploy = Array.from(modal.querySelectorAll('#preDeploy-list input[data-type="preDeploy"]'))
              .map((input: any) => input.value.trim())
              .filter((v: string) => v.length > 0)

            const postDeploy = Array.from(modal.querySelectorAll('#postDeploy-list input[data-type="postDeploy"]'))
              .map((input: any) => input.value.trim())
              .filter((v: string) => v.length > 0)

            await api.templates.update(id, {
              displayName: (document.getElementById('view-display-name') as HTMLInputElement).value,
              description: (document.getElementById('view-description') as HTMLTextAreaElement).value,
              commands,
              preDeploy,
              postDeploy
            })
            showNotification('Template updated successfully', 'success')
            modal.remove()
            await loadTemplates()
          } catch (error) {
            showNotification('Failed to update template: ' + (error as Error).message, 'error')
          }
        })
      }
    }
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
      <form id="edit-template-form">
        <div class="form-group">
          <label for="display-name">Display Name</label>
          <input type="text" id="display-name" value="${escapeHtml(template.displayName)}" required>
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
          <label for="pre-deploy">Pre-Deploy (JSON array)</label>
          <textarea id="pre-deploy">${JSON.stringify(template.preDeploy || [], null, 2)}</textarea>
        </div>
        <div class="form-group">
          <label for="post-deploy">Post-Deploy (JSON array)</label>
          <textarea id="post-deploy">${JSON.stringify(template.postDeploy || [], null, 2)}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">Update Template</button>
      </form>
    `

    const modal = createModal('Edit Template', content)
    const form = modal.querySelector('#edit-template-form') as HTMLFormElement

    if (form) {
      form.addEventListener('submit', async (e: Event) => {
        e.preventDefault()
        try {
          await api.templates.update(id, {
            displayName: (document.getElementById('display-name') as HTMLInputElement).value,
            description: (document.getElementById('description') as HTMLTextAreaElement).value,
            commands: JSON.parse((document.getElementById('commands') as HTMLTextAreaElement).value),
            preDeploy: JSON.parse((document.getElementById('pre-deploy') as HTMLTextAreaElement).value || '[]'),
            postDeploy: JSON.parse((document.getElementById('post-deploy') as HTMLTextAreaElement).value || '[]')
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

function makeFieldEditable(displayEl: HTMLElement): void {
  const parent = displayEl.parentElement
  if (!parent) return

  const input = parent.querySelector('input, textarea')
  if (!input) return

  displayEl.style.display = 'none'
  input.style.display = 'block'
  input.focus()

  const revertToDisplay = () => {
    displayEl.textContent = (input as HTMLInputElement).value
    displayEl.style.display = 'block'
    input.style.display = 'none'
  }

  input.addEventListener('blur', revertToDisplay, { once: true })
  input.addEventListener('keydown', (e: Event) => {
    const keyEvent = e as KeyboardEvent
    if (keyEvent.key === 'Enter' && !(input instanceof HTMLTextAreaElement)) {
      keyEvent.preventDefault()
      input.blur()
    } else if (keyEvent.key === 'Escape') {
      (input as HTMLInputElement).value = displayEl.textContent || ''
      input.blur()
    }
  })
}

function makeEditable(displayEl: HTMLElement): void {
  const commandLine = displayEl.closest('.command-line')
  if (!commandLine) return

  const input = commandLine.querySelector('input')
  if (!input) return

  displayEl.style.display = 'none'
  input.style.display = 'block'
  input.focus()

  const revertToDisplay = () => {
    displayEl.textContent = input.value
    displayEl.style.display = 'block'
    input.style.display = 'none'
  }

  input.addEventListener('blur', revertToDisplay, { once: true })
  input.addEventListener('keydown', (e: Event) => {
    const keyEvent = e as KeyboardEvent
    if (keyEvent.key === 'Enter') {
      keyEvent.preventDefault()
      input.blur()
    } else if (keyEvent.key === 'Escape') {
      input.value = displayEl.textContent || ''
      input.blur()
    }
  })
}

function addCommandLine(type: string): void {
  const listId = `${type}-list`
  const list = document.getElementById(listId)
  if (!list) return

  const noCommandsEl = list.querySelector('.no-commands')
  if (noCommandsEl) {
    noCommandsEl.remove()
  }

  const commandLine = document.createElement('div')
  commandLine.className = 'command-line'
  commandLine.setAttribute('data-editable', 'true')
  commandLine.innerHTML = `
    <div class="command-display" onclick="makeEditable(this)" style="display: none;"></div>
    <input type="text" value="" data-type="${type}" placeholder="Enter command...">
    <button class="btn-remove" onclick="removeCommandLine(this)" title="Remove">&times;</button>
  `
  list.appendChild(commandLine)

  const input = commandLine.querySelector('input')
  const display = commandLine.querySelector('.command-display')

  if (input) {
    input.focus()

    const switchToDisplay = () => {
      if (display && input.value.trim()) {
        display.textContent = input.value
        display.style.display = 'block'
        input.style.display = 'none'
      }
    }

    input.addEventListener('blur', switchToDisplay, { once: true })
    input.addEventListener('keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent
      if (keyEvent.key === 'Enter') {
        keyEvent.preventDefault()
        input.blur()
      }
    })
  }
}

function removeCommandLine(button: HTMLElement): void {
  const commandLine = button.closest('.command-line')
  if (!commandLine) return

  const list = commandLine.parentElement
  commandLine.remove()

  if (list && list.children.length === 0) {
    const noCommandsDiv = document.createElement('div')
    noCommandsDiv.className = 'no-commands'
    noCommandsDiv.textContent = 'No commands'
    list.appendChild(noCommandsDiv)
  }
}

function showAddTemplateModal(): void {
  const content = `
    <form id="add-template-form">
      <div class="form-group">
        <label for="template-name">Template ID</label>
        <input type="text" id="template-name" required placeholder="my-custom-template">
      </div>
      <div class="form-group">
        <label for="display-name">Display Name</label>
        <input type="text" id="display-name" required placeholder="My Custom Template">
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
  const form = modal.querySelector('#add-template-form') as HTMLFormElement

  if (form) {
    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault()
      try {
        await api.templates.create({
          name: (document.getElementById('template-name') as HTMLInputElement).value,
          displayName: (document.getElementById('display-name') as HTMLInputElement).value,
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

    const addBtn = document.getElementById('add-template-btn')
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
    addCommandLine: typeof addCommandLine
    removeCommandLine: typeof removeCommandLine
    makeEditable: typeof makeEditable
    makeFieldEditable: typeof makeFieldEditable
  }
}

window.loadTemplates = loadTemplates
window.viewTemplate = viewTemplate
window.editTemplate = editTemplate
window.deleteTemplate = deleteTemplate
window.showAddTemplateModal = showAddTemplateModal
window.addCommandLine = addCommandLine
window.removeCommandLine = removeCommandLine
window.makeEditable = makeEditable
window.makeFieldEditable = makeFieldEditable
