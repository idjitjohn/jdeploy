'use client'

import { useState } from 'react'
import Button from '@/components/Button'
import { escapeHtml } from '@/lib/utils'
import TemplateForm from '../TemplateForm'
import './TemplateView.scss'

interface TemplateViewProps {
  template: {
    id: string
    name: string
    displayName: string
    description: string
    isSystem?: boolean
    commands?: string[]
  }
  onClose: () => void
  onEdit?: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export default function TemplateView({ template, onClose, onEdit, onDelete }: TemplateViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = async (data: any) => {
    if (onEdit) {
      await onEdit({ ...data, id: template.id })
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete template "${template.displayName}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(template.id)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing && !template.isSystem) {
    return (
      <div className="TemplateView">
        <h4>Edit Template</h4>
        <TemplateForm
          initialData={template}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="TemplateView">
      <div className="view-header">
        <div>
          <h4>{escapeHtml(template.displayName)}</h4>
          <p className="name">{escapeHtml(template.name)}</p>
        </div>
        {template.isSystem && <span className="system-badge">System Template</span>}
      </div>

      <div className="view-section">
        <h5>Description</h5>
        <p>{escapeHtml(template.description)}</p>
      </div>

      {template.commands && template.commands.length > 0 && (
        <div className="view-section">
          <h5>Build Commands</h5>
          <ul className="commands-list">
            {template.commands.map((cmd, idx) => (
              <li key={idx}>{escapeHtml(cmd)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="view-actions">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {!template.isSystem && (
          <>
            <Button onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
