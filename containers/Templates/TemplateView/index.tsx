'use client'

import { escapeHtml } from '@/lib/utils'
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
}

export default function TemplateView({ template }: TemplateViewProps) {
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
    </div>
  )
}
