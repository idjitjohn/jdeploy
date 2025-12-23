'use client'

import { useEffect, useState } from 'react'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import CommandList from './CommandList'
import CommandEditor from './CommandEditor'
import { useTemplateForm } from './useTemplateForm'
import './TemplateForm.scss'

interface TemplateFormProps {
  initialData?: {
    id?: string
    name: string
    displayName: string
    description: string
    commands?: string[]
  }
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export default function TemplateForm({ initialData, onSubmit, onCancel }: TemplateFormProps) {
  const { formData, errors, isSubmitting, setFormData, validateForm, handleSubmit } = useTemplateForm(initialData)
  const [editingCommandIndex, setEditingCommandIndex] = useState<number | null>(null)
  const [editingCommand, setEditingCommand] = useState('')

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCommandsChange = (commands: string[]) => {
    setFormData(prev => ({
      ...prev,
      commands
    }))
  }

  const handleEditCommand = (index: number, command: string) => {
    setEditingCommandIndex(index)
    setEditingCommand(command)
  }

  const handleSaveCommand = (newCommand: string) => {
    if (editingCommandIndex !== null) {
      const newCommands = [...formData.commands]
      newCommands[editingCommandIndex] = newCommand
      handleCommandsChange(newCommands)
      setEditingCommandIndex(null)
      setEditingCommand('')
    }
  }

  const handleAddCommand = () => {
    setFormData(prev => ({
      ...prev,
      commands: [...prev.commands, '']
    }))
  }

  const handleDeleteCommand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      commands: prev.commands.filter((_, i) => i !== index)
    }))
  }

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmit(onSubmit)
  }

  return (
    <>
    <form className="TemplateForm" onSubmit={onFormSubmit}>
      <div className="form-group">
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
      </div>

      <div className="form-group">
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
      </div>

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

      <div className="form-group">
        <label>Build Commands</label>
        <CommandList
          commands={formData.commands}
          onCommandsChange={handleCommandsChange}
          onEditCommand={handleEditCommand}
          onAddCommand={handleAddCommand}
          onDeleteCommand={handleDeleteCommand}
        />
        <p className="hint">Drag to reorder, click Edit to modify, or delete commands</p>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </form>

    <CommandEditor
      isOpen={editingCommandIndex !== null}
      command={editingCommand}
      onSave={handleSaveCommand}
      onCancel={() => setEditingCommandIndex(null)}
    />
    </>
  )
}
