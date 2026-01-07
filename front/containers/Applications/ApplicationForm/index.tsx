'use client'

import { useState, useRef, useMemo } from 'react'
import Input from '@/front/components/Input'
import Select from '@/front/components/Select'
import Button from '@/front/components/Button'
import CodeEditor from '@/front/components/CodeEditor'
import CommandList, { CommandListHandle } from '@/front/containers/Templates/TemplateForm/CommandList'
import FileTransferList from './FileTransferList'
import { useRepositoryForm, FileTransfer } from './useApplicationForm'
import './RepositoryForm.scss'

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
  domains: Array<{ id: string; name: string }>
  templates: Array<{
    id: string
    displayName: string
    prebuild?: string[]
    build?: string[]
    deployment?: string[]
    launch?: string[]
    files?: FileTransfer[]
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
    prebuild?: string[]
    build?: string[]
    deployment?: string[]
    launch?: string[]
    files?: FileTransfer[]
    nginxConfig?: string
    env?: string
    envFilePath?: string
  }
}

export default function RepositoryForm({ onSubmit, onCancel, domains, templates, initialData }: Props) {
  const isEdit = !!initialData?.id
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const prebuildListRef = useRef<CommandListHandle>(null)
  const buildListRef = useRef<CommandListHandle>(null)
  const deploymentListRef = useRef<CommandListHandle>(null)
  const launchListRef = useRef<CommandListHandle>(null)
  const {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData
  } = useRepositoryForm({ onSubmit, initialData })

  // Check if template-related fields have changed
  const hasTemplateChanges = useMemo(() => {
    if (!selectedTemplateId) {
      return false
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
    if (!selectedTemplate) {
      return false
    }

    // Compare all command fields
    const prebuildChanged = JSON.stringify(formData.prebuild || []) !== JSON.stringify(selectedTemplate.prebuild || [])
    const buildChanged = JSON.stringify(formData.build || []) !== JSON.stringify(selectedTemplate.build || [])
    const deploymentChanged = JSON.stringify(formData.deployment || []) !== JSON.stringify(selectedTemplate.deployment || [])
    const launchChanged = JSON.stringify(formData.launch || []) !== JSON.stringify(selectedTemplate.launch || [])
    const nginxChanged = (formData.nginxConfig || '') !== (selectedTemplate.nginxConfig || '')
    const envChanged = (formData.env || '') !== (selectedTemplate.env || '')

    return prebuildChanged || buildChanged || deploymentChanged || launchChanged || nginxChanged || envChanged
  }, [formData, selectedTemplateId, templates])

  const onFormSubmit = (e: React.FormEvent) => {
    prebuildListRef.current?.flushAllEdits()
    buildListRef.current?.flushAllEdits()
    deploymentListRef.current?.flushAllEdits()
    launchListRef.current?.flushAllEdits()
    handleSubmit(e)
  }

  const handlePrebuildChange = (commands: string[]) => {
    setFormData(prev => ({ ...prev, prebuild: commands }))
  }

  const handleAddPrebuild = (afterIndex?: number) => {
    setFormData(prev => {
      const prebuild = [...(prev.prebuild || [])]
      if (afterIndex !== undefined) {
        prebuild.splice(afterIndex + 1, 0, '')
      } else {
        prebuild.push('')
      }
      return { ...prev, prebuild }
    })
  }

  const handleDeletePrebuild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prebuild: (prev.prebuild || []).filter((_, i) => i !== index)
    }))
  }

  const handleBuildChange = (commands: string[]) => {
    setFormData(prev => ({ ...prev, build: commands }))
  }

  const handleAddBuild = (afterIndex?: number) => {
    setFormData(prev => {
      const build = [...(prev.build || [])]
      if (afterIndex !== undefined) {
        build.splice(afterIndex + 1, 0, '')
      } else {
        build.push('')
      }
      return { ...prev, build }
    })
  }

  const handleDeleteBuild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      build: (prev.build || []).filter((_, i) => i !== index)
    }))
  }

  const handleDeploymentChange = (commands: string[]) => {
    setFormData(prev => ({ ...prev, deployment: commands }))
  }

  const handleAddDeployment = (afterIndex?: number) => {
    setFormData(prev => {
      const deployment = [...(prev.deployment || [])]
      if (afterIndex !== undefined) {
        deployment.splice(afterIndex + 1, 0, '')
      } else {
        deployment.push('')
      }
      return { ...prev, deployment }
    })
  }

  const handleDeleteDeployment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deployment: (prev.deployment || []).filter((_, i) => i !== index)
    }))
  }

  const handleLaunchChange = (commands: string[]) => {
    setFormData(prev => ({ ...prev, launch: commands }))
  }

  const handleAddLaunch = (afterIndex?: number) => {
    setFormData(prev => {
      const launch = [...(prev.launch || [])]
      if (afterIndex !== undefined) {
        launch.splice(afterIndex + 1, 0, '')
      } else {
        launch.push('')
      }
      return { ...prev, launch }
    })
  }

  const handleDeleteLaunch = (index: number) => {
    setFormData(prev => ({
      ...prev,
      launch: (prev.launch || []).filter((_, i) => i !== index)
    }))
  }

  const handleTemplateSelect = (templateId: string) => {
    if (hasTemplateChanges) {
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
        prebuild: selectedTemplate.prebuild || [],
        build: selectedTemplate.build || [],
        deployment: selectedTemplate.deployment || [],
        launch: selectedTemplate.launch || [],
        files: selectedTemplate.files || [],
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
                <label>Prebuild Commands</label>
                <CommandList
                  commands={formData.prebuild || []}
                  onCommandsChange={handlePrebuildChange}
                  onAddCommand={handleAddPrebuild}
                  onDeleteCommand={handleDeletePrebuild}
                  listRef={(handle) => {
                    prebuildListRef.current = handle
                  }}
                />
                <p className="hint">Git operations and cleanup (runs in code folder)</p>
              </div>

              <div className="command-section">
                <label>Build Commands</label>
                <CommandList
                  commands={formData.build || []}
                  onCommandsChange={handleBuildChange}
                  onAddCommand={handleAddBuild}
                  onDeleteCommand={handleDeleteBuild}
                  listRef={(handle) => {
                    buildListRef.current = handle
                  }}
                />
                <p className="hint">Install dependencies (runs in code folder)</p>
              </div>

              <div className="command-section">
                <label>Deployment Files</label>
                <FileTransferList
                  items={formData.files || []}
                  onChange={(items) => setFormData(prev => ({ ...prev, files: items }))}
                />
                <p className="hint">Files to copy/move for the deployment</p>
              </div>

              <div className="command-section">
                <label>Deployment Commands</label>
                <CommandList
                  commands={formData.deployment || []}
                  onCommandsChange={handleDeploymentChange}
                  onAddCommand={handleAddDeployment}
                  onDeleteCommand={handleDeleteDeployment}
                  listRef={(handle) => {
                    deploymentListRef.current = handle
                  }}
                />
                <p className="hint">Build and copy to release folder (runs in code folder)</p>
              </div>

              <div className="command-section">
                <label>Launch Commands</label>
                <CommandList
                  commands={formData.launch || []}
                  onCommandsChange={handleLaunchChange}
                  onAddCommand={handleAddLaunch}
                  onDeleteCommand={handleDeleteLaunch}
                  listRef={(handle) => {
                    launchListRef.current = handle
                  }}
                />
                <p className="hint">Service restart and finalization (runs in release folder)</p>
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
            <>
              <Input
                label="Environment File Path"
                name="envFilePath"
                value={formData.envFilePath || '.env'}
                onChange={handleChange}
                placeholder=".env"
              />

              <div className="command-section">
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
            <div className="row">
              <Select
                label="Template"
                name="template"
                value={formData.template}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                disabled={hasTemplateChanges}
                required
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.displayName}
                  </option>
                ))}
              </Select>
              <Select
                label="Environment"
                name="environment"
                value={formData.environment}
                onChange={handleChange}
                required
              >
                <option value="dev">Development</option>
                <option value="prod">Production</option>
                <option value="stag">Staging</option>
                <option value="test">Test</option>
              </Select>
            </div>
            <div className="row">
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
            </div>
            {hasTemplateChanges && selectedTemplateId && (
              <p className="hint" style={{ marginTop: '-1em', color: '#9ca3af', fontSize: '0.75em' }}>
                Template selector is disabled after making changes
              </p>
            )}
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="command-section">
              <label>Prebuild Commands</label>
              <CommandList
                commands={formData.prebuild || []}
                onCommandsChange={handlePrebuildChange}
                onAddCommand={handleAddPrebuild}
                onDeleteCommand={handleDeletePrebuild}
                listRef={(handle) => {
                  prebuildListRef.current = handle
                }}
              />
              <p className="hint">Git operations and cleanup (runs in code folder)</p>
            </div>

            <div className="command-section">
              <label>Build Commands</label>
              <CommandList
                commands={formData.build || []}
                onCommandsChange={handleBuildChange}
                onAddCommand={handleAddBuild}
                onDeleteCommand={handleDeleteBuild}
                listRef={(handle) => {
                  buildListRef.current = handle
                }}
              />
              <p className="hint">Install dependencies (runs in code folder)</p>
            </div>

            <div className="command-section">
              <label>Deployment Files</label>
              <FileTransferList
                items={formData.files || []}
                onChange={(items) => setFormData(prev => ({ ...prev, files: items }))}
              />
              <p className="hint">Files to copy/move for the deployment</p>
            </div>

            <div className="command-section">
              <label>Deployment Commands</label>
              <CommandList
                commands={formData.deployment || []}
                onCommandsChange={handleDeploymentChange}
                onAddCommand={handleAddDeployment}
                onDeleteCommand={handleDeleteDeployment}
                listRef={(handle) => {
                  deploymentListRef.current = handle
                }}
              />
              <p className="hint">Build and copy to release folder (runs in code folder)</p>
            </div>

            <div className="command-section">
              <label>Launch Commands</label>
              <CommandList
                commands={formData.launch || []}
                onCommandsChange={handleLaunchChange}
                onAddCommand={handleAddLaunch}
                onDeleteCommand={handleDeleteLaunch}
                listRef={(handle) => {
                  launchListRef.current = handle
                }}
              />
              <p className="hint">Service restart and finalization (runs in release folder)</p>
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
            <div className="command-section">
              <label>Environment Variables</label>
              <CodeEditor
                value={formData.env || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, env: value }))}
                placeholder="KEY=VALUE (environment variables)..."
                language="env"
              />
            </div>
            <Input
              label="Environment File Path"
              name="envFilePath"
              value={formData.envFilePath || '.env'}
              onChange={handleChange}
              placeholder=".env"
            />
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
              Prepare
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
