'use client'

import { useState } from 'react'
import Button from '@/front/components/Button'
import TemplateForm from '../TemplateForm'
import './TemplateEditor.scss'

interface TemplateEditorProps {
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
  onDelete?: (id: string, displayName: string) => Promise<void>
}

export default function TemplateEditor({ template, onClose, onEdit, onDelete }: TemplateEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = async (data: any) => {
    if (onEdit) {
      await onEdit({ ...data, id: template.id })
      setIsEditing(false)
      onClose()
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete template "${template.displayName}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(template.id, template.displayName)
        onClose()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing && !template.isSystem) {
    return (
      <div className="TemplateEditor">
        <TemplateForm
          initialData={template}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="TemplateEditor">
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
