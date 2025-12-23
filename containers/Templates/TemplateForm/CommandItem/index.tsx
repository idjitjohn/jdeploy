'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Button from '@/components/Button'
import './CommandItem.scss'

interface Props {
  id: string
  command: string
  index: number
  onEdit: () => void
  onDelete: () => void
}

export default function CommandItem({ id, command, index, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`CommandItem ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <code className="ci-text">{command}</code>

      <div className="ci-actions">
        <button
          className="ci-action edit"
          onClick={onEdit}
          aria-label="Edit command"
          type="button"
        />

        <button
          className="ci-action delete"
          onClick={onDelete}
          aria-label="Delete command"
          type="button"
        />
      </div>
    </div>
  )
}
