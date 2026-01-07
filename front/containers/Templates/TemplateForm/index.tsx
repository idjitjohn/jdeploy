'use client'

import { useState, useRef, useMemo } from 'react'
import Input from '@/front/components/Input'
import Textarea from '@/front/components/Textarea'
import Select from '@/front/components/Select'
import Button from '@/front/components/Button'
import CodeEditor from '@/front/components/CodeEditor'
import CommandList, { CommandListHandle } from './CommandList'
import FileTransferList from '@/front/containers/Applications/ApplicationForm/FileTransferList'
import { useTemplateForm } from './useTemplateForm'
import './TemplateForm.scss'

type FileOperation = 'cp' | 'mv' | 'ln'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface TemplateFormProps {
  initialData?: {
    id?: string
    name: string
    displayName: string
    description: string
    prebuild?: string[]
    build?: string[]
    deployment?: string[]
    launch?: string[]
    files?: FileTransfer[]
    nginxConfig?: string
    env?: string
  }
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  availableTemplates?: Array<{
    id: string
    name: string
    displayName: string
    description: string
    prebuild?: string[]
    build?: string[]
    deployment?: string[]
    launch?: string[]
    files?: FileTransfer[]
    nginxConfig?: string
    env?: string
  }>
}

export default function TemplateForm({ initialData, onSubmit, onCancel, availableTemplates = [] }: TemplateFormProps) {
  const isEdit = !!initialData?.id
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const { formData, errors, isSubmitting, setFormData, handleSubmit } = useTemplateForm(initialData)
  const prebuildListRef = useRef<CommandListHandle>(null)
  const buildListRef = useRef<CommandListHandle>(null)
  const deploymentListRef = useRef<CommandListHandle>(null)
  const launchListRef = useRef<CommandListHandle>(null)

  // Check if form data has changed from initial state
  const hasChanges = useMemo(() => {
    if (!initialData && !selectedTemplateId) {
      return formData.name !== '' || formData.displayName !== '' || formData.description !== ''
    }
    return true
  }, [formData, initialData, selectedTemplateId])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTemplateSelect = (templateId: string) => {
    if (hasChanges) {
      const proceed = window.confirm(
        'Selecting a template will overwrite all current changes. Continue?'
      )
      if (!proceed) return
    }

    const selectedTemplate = availableTemplates.find(t => t.id === templateId)
    if (selectedTemplate) {
      setSelectedTemplateId(templateId)
      setFormData({
        name: selectedTemplate.name,
        displayName: selectedTemplate.displayName,
        description: selectedTemplate.description,
        prebuild: selectedTemplate.prebuild || [],
        build: selectedTemplate.build || [],
        deployment: selectedTemplate.deployment || [],
        launch: selectedTemplate.launch || [],
        files: selectedTemplate.files || [],
        nginxConfig: selectedTemplate.nginxConfig || '',
        env: selectedTemplate.env || ''
      })
    }
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

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    prebuildListRef.current?.flushAllEdits()
    buildListRef.current?.flushAllEdits()
    deploymentListRef.current?.flushAllEdits()
    launchListRef.current?.flushAllEdits()
    await handleSubmit(onSubmit)
  }

  // Edit mode with tabs
  if (isEdit) {
    return (
      <form className="TemplateForm edit-mode" onSubmit={onFormSubmit}>
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
                label="Template Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., react-app"
                required
              />
              {errors.name && <span className="error">{errors.name}</span>}

              <Input
                label="Display Name"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder="e.g., React Application"
                required
              />
              {errors.displayName && <span className="error">{errors.displayName}</span>}

              <div className="form-group">
                <label>Description</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe this template..."
                  rows={4}
                />
                {errors.description && <span className="error">{errors.description}</span>}
              </div>
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
                onChange={(value) => handleChange('nginxConfig', value)}
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
                onChange={(value) => handleChange('env', value)}
                placeholder="KEY=BLABLA (environment variables)..."
                language="env"
              />
            </div>
          )}
        </div>

        <div className="actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </form>
    )
  }

  // Add mode with tabs and template selector
  return (
    <form className="TemplateForm add-mode" onSubmit={onFormSubmit}>
      {availableTemplates.length > 0 && (
        <div className="template-selector">
          <Select
            label="Clone from existing template (Optional)"
            name="templateSelector"
            value={selectedTemplateId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            disabled={hasChanges}
            size="sm"
          >
            <option value="">Select a template to clone...</option>
            {availableTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.displayName}
              </option>
            ))}
          </Select>
          {hasChanges && selectedTemplateId && (
            <p className="hint" style={{ marginTop: '0.5em', color: '#9ca3af' }}>
              Template selector is disabled after making changes
            </p>
          )}
        </div>
      )}

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
              label="Template Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., react-app"
              required
            />
            {errors.name && <span className="error">{errors.name}</span>}

            <Input
              label="Display Name"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="e.g., React Application"
              required
            />
            {errors.displayName && <span className="error">{errors.displayName}</span>}

            <div className="form-group">
              <label>Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe this template..."
                rows={4}
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>
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
              onChange={(value) => handleChange('nginxConfig', value)}
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
              onChange={(value) => handleChange('env', value)}
              placeholder="KEY=BLABLA (environment variables)..."
              language="env"
            />
          </div>
        )}
      </div>

      <div className="actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </form>
  )
}
