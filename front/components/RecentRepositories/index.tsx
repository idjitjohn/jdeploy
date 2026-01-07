import './RecentRepositories.scss'
import Badge from '../Badge'

interface Repository {
  id: string | number
  name: string
  branch: string
  status: 'running' | 'stopped' | 'error'
  lastDeployment?: string
  port?: number
}

interface Props {
  repositories: Repository[]
  onDeploy?: (id: string | number) => void
  onViewAll?: () => void
  loading?: boolean
  className?: string
}

export default function RecentRepositories({
  repositories,
  onDeploy,
  onViewAll,
  loading = false,
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
    <div className={`RecentRepositories ${className}`}>
      <div className="header">
        <h3 className="title">Recent Repositories</h3>
        {onViewAll && (
          <button className="view-all" onClick={onViewAll}>
            View All
          </button>
        )}
      </div>
      <div className="list">
        {loading ? (
          <div className="empty">Loading repositories...</div>
        ) : repositories.length === 0 ? (
          <div className="empty">No repositories yet</div>
        ) : (
          repositories.map((repo) => (
            <div key={repo.id} className="item">
              <div className="info">
                <div className="name">{repo.name}</div>
                <div className="details">
                  <span className="branch">{repo.branch}</span>
                  {repo.port && (
                    <span className="port">:{repo.port}</span>
                  )}
                  {repo.lastDeployment && (
                    <span className="time">{repo.lastDeployment}</span>
                  )}
                </div>
              </div>
              <div className="actions">
                <Badge variant={getStatusColor(repo.status)}>
                  {repo.status}
                </Badge>
                {onDeploy && (
                  <button
                    className="deploy-btn"
                    onClick={() => onDeploy(repo.id)}
                  >
                    Deploy
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
