import './RepositoryCard.scss'
import Badge from '../Badge'

interface Props {
  name: string
  url: string
  branch: string
  template: string
  domain?: string
  port?: number
  status: 'running' | 'stopped' | 'error'
  lastDeployment?: string
  onDeploy?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export default function RepositoryCard({
  name,
  url,
  branch,
  template,
  domain,
  port,
  status,
  lastDeployment,
  onDeploy,
  onEdit,
  onDelete,
  className = ''
}: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success'
      case 'stopped':
        return 'neutral'
      case 'error':
        return 'error'
      default:
        return 'neutral'
    }
  }

  return (
    <div className={`RepositoryCard ${className}`}>
      <div className="header">
        <div className="title-section">
          <h3 className="name">{name}</h3>
          <Badge variant={getStatusColor(status)}>
            {status}
          </Badge>
        </div>
        <div className="actions">
          {onEdit && (
            <button
              className="action-btn edit"
              onClick={onEdit}
              title="Edit"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className="action-btn delete"
              onClick={onDelete}
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div className="row">
          <span className="label">URL:</span>
          <code className="value">{url}</code>
        </div>

        <div className="row">
          <span className="label">Branch:</span>
          <span className="value">{branch}</span>
        </div>

        <div className="row">
          <span className="label">Template:</span>
          <span className="value">{template}</span>
        </div>

        {domain && (
          <div className="row">
            <span className="label">Domain:</span>
            <span className="value">{domain}</span>
          </div>
        )}

        {port && (
          <div className="row">
            <span className="label">Port:</span>
            <span className="value">{port}</span>
          </div>
        )}

        {lastDeployment && (
          <div className="row">
            <span className="label">Last Deployment:</span>
            <span className="value">{lastDeployment}</span>
          </div>
        )}
      </div>

      {onDeploy && (
        <div className="footer">
          <button
            className="deploy-btn"
            onClick={onDeploy}
          >
            Deploy Now
          </button>
        </div>
      )}
    </div>
  )
}
