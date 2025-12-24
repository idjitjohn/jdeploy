'use client'

import Badge from '@/components/Badge'
import Button from '@/components/Button'
import { escapeHtml } from '@/lib/utils'
import './TemplateCard.scss'

interface TemplateCardProps {
  id: string
  displayName: string
  description: string
  isSystem?: boolean
  onEdit: () => void
  onDelete: () => void
}

export default function TemplateCard({
  id,
  displayName,
  description,
  isSystem,
  onEdit,
  onDelete
}: TemplateCardProps) {
  return (
    <div className="TemplateCard">
      <div className="card-header">
        <h3>{escapeHtml(displayName)}</h3>
        <Badge size='sm' variant={isSystem ? 'neutral' : 'primary'}>
          {isSystem ? 'System' : 'Custom'}
        </Badge>
      </div>
      <div className="card-body">
        <p className="description">{escapeHtml(description)}</p>
      </div>
      <div className="card-actions">
        <Button size="sm" onClick={onEdit}>Edit</Button>
        {!isSystem && (
          <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>
        )}
      </div>
    </div>
  )
}
