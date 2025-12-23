'use client'

import { useState } from 'react'
import Input from '@/components/Input'
import Button from '@/components/Button'
import './CommandEditor.scss'

interface Props {
  isOpen: boolean
  command: string
  onSave: (newCommand: string) => void
  onCancel: () => void
}

export default function CommandEditor({ isOpen, command, onSave, onCancel }: Props) {
  const [editValue, setEditValue] = useState(command)

  const handleSave = () => {
    if (editValue.trim()) {
      onSave(editValue.trim())
    }
  }

  if (!isOpen) return null

  return (
    <div className="CommandEditor">
      <div className="editor-overlay" onClick={onCancel}></div>
      <div className="editor-modal">
        <h4>Edit Command</h4>
        
        <div className="editor-content">
          <label>Command</label>
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter command"
          />
        </div>

        <div className="editor-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
