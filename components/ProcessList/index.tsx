import './ProcessList.scss'
import Badge from '../Badge'

interface Process {
  id: string | number
  name: string
  status: 'running' | 'stopped' | 'error'
  uptime?: string
  memory?: string
  cpu?: string
}

interface Props {
  processes: Process[]
  onStart?: (id: string | number) => void
  onStop?: (id: string | number) => void
  onRestart?: (id: string | number) => void
  loading?: boolean
  className?: string
}

export default function ProcessList({
  processes,
  onStart,
  onStop,
  onRestart,
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
    <div className={`ProcessList ${className}`}>
      <div className="header">
        <div className="col col-name">Process</div>
        <div className="col col-status">Status</div>
        <div className="col col-info">Uptime</div>
        <div className="col col-info">Memory</div>
        <div className="col col-info">CPU</div>
        <div className="col col-actions">Actions</div>
      </div>
      <div className="content">
        {loading ? (
          <div className="empty">Loading processes...</div>
        ) : processes.length === 0 ? (
          <div className="empty">No processes running</div>
        ) : (
          processes.map((process) => (
            <div key={process.id} className="item">
              <div className="col col-name">
                <span className="name">{process.name}</span>
              </div>
              <div className="col col-status">
                <Badge variant={getStatusColor(process.status)}>
                  {process.status}
                </Badge>
              </div>
              <div className="col col-info">
                {process.uptime || '-'}
              </div>
              <div className="col col-info">
                {process.memory || '-'}
              </div>
              <div className="col col-info">
                {process.cpu || '-'}
              </div>
              <div className="col col-actions">
                <div className="buttons">
                  {process.status === 'stopped' && onStart && (
                    <button
                      className="btn btn-start"
                      onClick={() => onStart(process.id)}
                    >
                      Start
                    </button>
                  )}
                  {process.status === 'running' && onStop && (
                    <button
                      className="btn btn-stop"
                      onClick={() => onStop(process.id)}
                    >
                      Stop
                    </button>
                  )}
                  {onRestart && (
                    <button
                      className="btn btn-restart"
                      onClick={() => onRestart(process.id)}
                    >
                      Restart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
