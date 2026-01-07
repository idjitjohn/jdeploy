import './RecentLogs.scss'
import Badge from '../Badge'

interface Log {
  id: string | number
  repository: string
  branch: string
  status: 'success' | 'failed' | 'running' | 'pending'
  timestamp: string
  duration?: string
}

interface Props {
  logs: Log[]
  onViewAll?: () => void
  loading?: boolean
  className?: string
}

export default function RecentLogs({
  logs,
  onViewAll,
  loading = false,
  className = ''
}: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success'
      case 'failed':
        return 'error'
      case 'running':
        return 'info'
      case 'pending':
        return 'warning'
      default:
        return 'neutral'
    }
  }

  return (
    <div className={`RecentLogs ${className}`}>
      <div className="header">
        <h3 className="title">Recent Deployments</h3>
        {onViewAll && (
          <button className="view-all" onClick={onViewAll}>
            View All
          </button>
        )}
      </div>
      <div className="list">
        {loading ? (
          <div className="empty">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty">No deployments yet</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="item">
              <div className="info">
                <div className="repo">{log.repository}</div>
                <div className="meta">
                  <span className="branch">{log.branch}</span>
                  <span className="time">{log.timestamp}</span>
                  {log.duration && (
                    <span className="duration">{log.duration}</span>
                  )}
                </div>
              </div>
              <Badge variant={getStatusColor(log.status)}>
                {log.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
