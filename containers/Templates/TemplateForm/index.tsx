'use client'

import { useState, useRef, useMemo } from 'react'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Select from '@/components/Select'
import Button from '@/components/Button'
import CodeEditor from '@/components/CodeEditor'
import CommandList, { CommandListHandle } from './CommandList'
import { useTemplateForm } from './useTemplateForm'
import './TemplateForm.scss'

interface TemplateFormProps {
  initialData?: {
    id?: string
    name: string
    displayName: string
    description: string
    commands?: string[]
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
    commands?: string[]
    nginxConfig?: string
    env?: string
  }>
}

export default function TemplateForm({ initialData, onSubmit, onCancel, availableTemplates = [] }: TemplateFormProps) {
  const isEdit = !!initialData?.id
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const { formData, errors, isSubmitting, setFormData, handleSubmit } = useTemplateForm(initialData)
  const commandListRef = useRef<CommandListHandle>(null)

  // Check if form data has changed from initial state
  const hasChanges = useMemo(() => {
    if (!initialData && !selectedTemplateId) {
      // Adding new template with no selection yet
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
        commands: selectedTemplate.commands || [],
        nginxConfig: selectedTemplate.nginxConfig || '',
        env: selectedTemplate.env || ''
      })
    }
  }

  const handleCommandsChange = (commands: string[]) => {
    setFormData(prev => ({
      ...prev,
      commands
    }))
  }

  const handleAddCommand = (afterIndex?: number) => {
    setFormData(prev => {
      const newCommands = [...(prev.commands || [])]
      if (afterIndex !== undefined) {
        newCommands.splice(afterIndex + 1, 0, '')
      } else {
        newCommands.push('')
      }
      return {
        ...prev,
        commands: newCommands
      }
    })
  }

  const handleDeleteCommand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      commands: (prev.commands || []).filter((_, i) => i !== index)
    }))
  }

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    commandListRef.current?.flushAllEdits()
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
                placeholder="Enter environment variables (KEY=value format, one per line)..."
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
              placeholder="Enter environment variables (KEY=value format, one per line)..."
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
