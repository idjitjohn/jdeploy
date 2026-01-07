'use client'

import { escapeHtml } from '@/front/lib/utils'
import './TemplateView.scss'

type FileOperation = 'cp' | 'mv' | 'ln'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface TemplateViewProps {
  template: {
    id: string
    name: string
    displayName: string
    description: string
    isSystem?: boolean
    prebuild?: string[]
    build?: string[]
    deployment?: string[]
    launch?: string[]
    files?: FileTransfer[]
    nginxConfig?: string
    env?: string
  }
}

export default function TemplateView({ template }: TemplateViewProps) {
  const getOpLabel = (op: FileOperation) => {
    switch (op) {
      case 'mv': return 'Move'
      case 'ln': return 'Symlink'
      case 'cp':
      default: return 'Copy'
    }
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

      {template.prebuild && template.prebuild.length > 0 && (
        <div className="view-section">
          <h5>Prebuild Commands</h5>
          <ul className="commands-list">
            {template.prebuild.map((cmd, idx) => (
              <li key={idx}>{escapeHtml(cmd)}</li>
            ))}
          </ul>
        </div>
      )}

      {template.build && template.build.length > 0 && (
        <div className="view-section">
          <h5>Build Commands</h5>
          <ul className="commands-list">
            {template.build.map((cmd, idx) => (
              <li key={idx}>{escapeHtml(cmd)}</li>
            ))}
          </ul>
        </div>
      )}

      {template.files && template.files.length > 0 && (
        <div className="view-section">
          <h5>Deployment Files</h5>
          <ul className="files-list">
            {template.files.map((file, idx) => (
              <li key={idx}>
                <span className="op-badge">{getOpLabel(file.op)}</span>
                <span className="src">{escapeHtml(file.src)}</span>
                <span className="arrow">→</span>
                <span className="dest">{escapeHtml(file.dest)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {template.deployment && template.deployment.length > 0 && (
        <div className="view-section">
          <h5>Deployment Commands</h5>
          <ul className="commands-list">
            {template.deployment.map((cmd, idx) => (
              <li key={idx}>{escapeHtml(cmd)}</li>
            ))}
          </ul>
        </div>
      )}

      {template.launch && template.launch.length > 0 && (
        <div className="view-section">
          <h5>Launch Commands</h5>
          <ul className="commands-list">
            {template.launch.map((cmd, idx) => (
              <li key={idx}>{escapeHtml(cmd)}</li>
            ))}
          </ul>
        </div>
      )}

      {template.nginxConfig && (
        <div className="view-section">
          <h5>Nginx Configuration</h5>
          <pre className="code-block">{template.nginxConfig}</pre>
        </div>
      )}

      {template.env && (
        <div className="view-section">
          <h5>Environment Variables</h5>
          <pre className="code-block">{template.env}</pre>
        </div>
      )}
    </div>
  )
}
