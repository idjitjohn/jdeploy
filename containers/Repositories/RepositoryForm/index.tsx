'use client'

import { useState, useRef, useMemo } from 'react'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Button from '@/components/Button'
import CodeEditor from '@/components/CodeEditor'
import CommandList, { CommandListHandle } from '@/containers/Templates/TemplateForm/CommandList'
import { useRepositoryForm } from './useRepositoryForm'
import './RepositoryForm.scss'

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
  domains: Array<{ id: string; name: string }>
  templates: Array<{ 
    id: string
    displayName: string
    commands?: string[]
    preDeploy?: string[]
    postDeploy?: string[]
    nginxConfig?: string
    env?: string
    description?: string
  }>
  initialData?: {
    id?: string
    name: string
    repoUrl: string
    domain?: string
    port?: number
    template?: string
    commands?: string[]
    preDeploy?: string[]
    postDeploy?: string[]
    nginxConfig?: string
    env?: string
  }
}

export default function RepositoryForm({ onSubmit, onCancel, domains, templates, initialData }: Props) {
  const isEdit = !!initialData?.id
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const commandListRef = useRef<CommandListHandle>(null)
  const preDeployListRef = useRef<CommandListHandle>(null)
  const postDeployListRef = useRef<CommandListHandle>(null)
  const {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData
  } = useRepositoryForm({ onSubmit, initialData })

  // Check if form data has changed from initial state
  const hasChanges = useMemo(() => {
    if (!initialData && !selectedTemplateId) {
      return formData.name !== '' || formData.repoUrl !== '' || formData.domain !== '' || formData.port !== ''
    }
    return true
  }, [formData, initialData, selectedTemplateId])

  const onFormSubmit = (e: React.FormEvent) => {
    commandListRef.current?.flushAllEdits()
    preDeployListRef.current?.flushAllEdits()
    postDeployListRef.current?.flushAllEdits()
    handleSubmit(e)
  }

  const handleCommandsChange = (commands: string[]) => {
    setFormData(prev => ({
      ...prev,
      commands
    }))
  }

  const handleAddCommand = (afterIndex?: number) => {
    setFormData(prev => {
      const commands = [...(prev.commands || [])]
      if (afterIndex !== undefined) {
        commands.splice(afterIndex + 1, 0, '')
      } else {
        commands.push('')
      }
      return { ...prev, commands }
    })
  }

  const handleDeleteCommand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      commands: (prev.commands || []).filter((_, i) => i !== index)
    }))
  }

  const handlePreDeployChange = (commands: string[]) => {
    setFormData(prev => ({
      ...prev,
      preDeploy: commands
    }))
  }

  const handleAddPreDeploy = (afterIndex?: number) => {
    setFormData(prev => {
      const preDeploy = [...(prev.preDeploy || [])]
      if (afterIndex !== undefined) {
        preDeploy.splice(afterIndex + 1, 0, '')
      } else {
        preDeploy.push('')
      }
      return { ...prev, preDeploy }
    })
  }

  const handleDeletePreDeploy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preDeploy: (prev.preDeploy || []).filter((_, i) => i !== index)
    }))
  }

  const handlePostDeployChange = (commands: string[]) => {
    setFormData(prev => ({
      ...prev,
      postDeploy: commands
    }))
  }

  const handleAddPostDeploy = (afterIndex?: number) => {
    setFormData(prev => {
      const postDeploy = [...(prev.postDeploy || [])]
      if (afterIndex !== undefined) {
        postDeploy.splice(afterIndex + 1, 0, '')
      } else {
        postDeploy.push('')
      }
      return { ...prev, postDeploy }
    })
  }

  const handleDeletePostDeploy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      postDeploy: (prev.postDeploy || []).filter((_, i) => i !== index)
    }))
  }

  const handleTemplateSelect = (templateId: string) => {
    if (hasChanges) {
      const proceed = window.confirm(
        'Selecting a template will overwrite all current changes. Continue?'
      )
      if (!proceed) return
    }

    const selectedTemplate = templates.find(t => t.id === templateId)
    if (selectedTemplate) {
      setSelectedTemplateId(templateId)
      setFormData(prev => ({
        ...prev,
        template: templateId,
        commands: selectedTemplate.commands || [],
        preDeploy: selectedTemplate.preDeploy || [],
        postDeploy: selectedTemplate.postDeploy || [],
        nginxConfig: selectedTemplate.nginxConfig || '',
        env: selectedTemplate.env || ''
      }))
    }
  }

  // Edit mode with tabs
  if (isEdit) {
    return (
      <form className="RepositoryForm edit-mode" onSubmit={onFormSubmit}>
        <div className="tabs">
          <button
            type="button"
            className={`tab ${currentStep === 0 ? 'active' : ''}`}
            onClick={() => setCurrentStep(0)}
          >
            Basic Info
          </button>
          <button
            type="button"
            className={`tab ${currentStep === 1 ? 'active' : ''}`}
            onClick={() => setCurrentStep(1)}
          >
            Commands
          </button>
          <button
            type="button"
            className={`tab ${currentStep === 2 ? 'active' : ''}`}
            onClick={() => setCurrentStep(2)}
          >
            Nginx Config
          </button>
          <button
            type="button"
            className={`tab ${currentStep === 3 ? 'active' : ''}`}
            onClick={() => setCurrentStep(3)}
          >
            Environment
          </button>
        </div>

        <div className="tab-content">
          {currentStep === 0 && (
            <>
              <Input
                label="Repository Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="my-app"
                required
              />
              <Input
                label="Repository URL"
                name="repoUrl"
                value={formData.repoUrl}
                onChange={handleChange}
                placeholder="https://github.com/user/repo.git"
                required
              />
              <Select
                label="Domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                required
              >
                <option value="">Select a domain</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.name}>
                    {domain.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                placeholder="3000"
                required
              />
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="command-section">
                <label>Build Commands</label>
                <CommandList
                  commands={formData.commands || []}
                  onCommandsChange={handleCommandsChange}
                  onAddCommand={handleAddCommand}
                  onDeleteCommand={handleDeleteCommand}
                  listRef={(handle) => {
                    commandListRef.current = handle
                  }}
                />
                <p className="hint">Click to edit, drag to reorder, or delete commands</p>
              </div>

              <div className="command-section">
                <label>Pre-Deploy Commands</label>
                <CommandList
                  commands={formData.preDeploy || []}
                  onCommandsChange={handlePreDeployChange}
                  onAddCommand={handleAddPreDeploy}
                  onDeleteCommand={handleDeletePreDeploy}
                  listRef={(handle) => {
                    preDeployListRef.current = handle
                  }}
                />
                <p className="hint">Commands to run before deployment</p>
              </div>

              <div className="command-section">
                <label>Post-Deploy Commands</label>
                <CommandList
                  commands={formData.postDeploy || []}
                  onCommandsChange={handlePostDeployChange}
                  onAddCommand={handleAddPostDeploy}
                  onDeleteCommand={handleDeletePostDeploy}
                  listRef={(handle) => {
                    postDeployListRef.current = handle
                  }}
                />
                <p className="hint">Commands to run after deployment</p>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <div className="command-section">
              <label>Nginx Configuration</label>
              <CodeEditor
                value={formData.nginxConfig || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, nginxConfig: value }))}
                placeholder="Enter nginx configuration..."
                language="nginx"
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="command-section">
              <label>Environment Variables</label>
              <CodeEditor
                value={formData.env || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, env: value }))}
                placeholder="KEY=VALUE (environment variables)..."
                language="env"
              />
            </div>
          )}
        </div>

        <div className="actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
            Update Application
          </Button>
        </div>
      </form>
    )
  }

  // Add mode with steps
  return (
    <form className="RepositoryForm add-mode" onSubmit={onFormSubmit}>
      <div className="step-content">
        {currentStep === 0 && (
          <>
            <Input
              label="Repository Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="my-app"
              required
            />
            <Input
              label="Repository URL"
              name="repoUrl"
              value={formData.repoUrl}
              onChange={handleChange}
              placeholder="https://github.com/user/repo.git"
              required
            />
            <Select
              label="Domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              required
            >
              <option value="">Select a domain</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.name}>
                  {domain.name}
                </option>
              ))}
            </Select>
            <Input
              label="Port"
              name="port"
              type="number"
              value={formData.port}
              onChange={handleChange}
              placeholder="3000"
              required
            />
            <Select
              label="Template"
              name="template"
              value={formData.template}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              disabled={hasChanges}
              required
            >
              <option value="">Select a template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.displayName}
                </option>
              ))}
            </Select>
            {hasChanges && selectedTemplateId && (
              <p className="hint" style={{ marginTop: '-1em', color: '#9ca3af', fontSize: '0.75em' }}>
                Template selector is disabled after making changes
              </p>
            )}
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="command-section">
              <label>Build Commands</label>
              <CommandList
                commands={formData.commands || []}
                onCommandsChange={handleCommandsChange}
                onAddCommand={handleAddCommand}
                onDeleteCommand={handleDeleteCommand}
                listRef={(handle) => {
                  commandListRef.current = handle
                }}
              />
              <p className="hint">Click to edit, drag to reorder, or delete commands</p>
            </div>

            <div className="command-section">
              <label>Pre-Deploy Commands</label>
              <CommandList
                commands={formData.preDeploy || []}
                onCommandsChange={handlePreDeployChange}
                onAddCommand={handleAddPreDeploy}
                onDeleteCommand={handleDeletePreDeploy}
                listRef={(handle) => {
                  preDeployListRef.current = handle
                }}
              />
              <p className="hint">Commands to run before deployment</p>
            </div>

            <div className="command-section">
              <label>Post-Deploy Commands</label>
              <CommandList
                commands={formData.postDeploy || []}
                onCommandsChange={handlePostDeployChange}
                onAddCommand={handleAddPostDeploy}
                onDeleteCommand={handleDeletePostDeploy}
                listRef={(handle) => {
                  postDeployListRef.current = handle
                }}
              />
              <p className="hint">Commands to run after deployment</p>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="command-section">
              <label>Nginx Configuration</label>
              <CodeEditor
                value={formData.nginxConfig || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, nginxConfig: value }))}
                placeholder="Enter nginx configuration..."
                language="nginx"
              />
            </div>

            <div className="command-section" style={{ marginTop: '1.5em' }}>
              <label>Environment Variables</label>
              <CodeEditor
                value={formData.env || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, env: value }))}
                placeholder="KEY=VALUE (environment variables)..."
                language="env"
              />
            </div>
          </>
        )}
      </div>

      <div className="actions">
        <div className="step-dots">
          <div className={`dot ${currentStep === 0 ? 'active' : ''}`}></div>
          <div className={`dot ${currentStep === 1 ? 'active' : ''}`}></div>
          <div className={`dot ${currentStep === 2 ? 'active' : ''}`}></div>
        </div>
        <div className="action-buttons">
          <Button
            type="button"
            variant="secondary"
            onClick={currentStep === 0 ? onCancel : () => setCurrentStep(currentStep - 1)}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          {currentStep < 2 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Deploy
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
