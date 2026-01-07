'use client'

import Header from '@/components/Header'
import Button from '@/components/Button'
import { useApplicationDetail } from './useApplicationDetail'
import { formatDate } from '@/lib/utils'
import './ApplicationDetail.scss'

interface Props {
  id: string
}

export default function ApplicationDetail({ id }: Props) {
  const {
    isLoading,
    application,
    logs,
    selectedLog,
    logContent,
    isLoadingLog,
    isRedeploying,
    selectLog,
    handleRedeploy,
    handleDelete,
    refreshLogs,
    clearHistory,
    goBack
  } = useApplicationDetail(id)

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success': return 'status-success'
      case 'failed': return 'status-failed'
      case 'running': return 'status-running'
      default: return 'status-pending'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'webhook': return 'Webhook'
      case 'manual': return 'Manual'
      case 'cli': return 'CLI'
      case 'initial': return 'Initial'
      default: return type
    }
  }

  if (isLoading) {
    return (
      <div className="ApplicationDetail">
        <Header />
        <main className="container">
          <div className="loading">Loading application...</div>
        </main>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="ApplicationDetail">
        <Header />
        <main className="container">
          <div className="not-found">
            <h2>Application not found</h2>
            <Button onClick={goBack}>Back to Applications</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="ApplicationDetail">
      <Header />
      <main className="container">
        <div className="top-bar">
          <button className="back-btn" onClick={goBack}>
            <span className="arrow">&larr;</span>
            <span>Applications</span>
          </button>
          <div className="actions">
            <Button
              onClick={handleRedeploy}
              disabled={isRedeploying}
              variant="primary"
            >
              {isRedeploying ? 'Deploying...' : 'Deploy'}
            </Button>
            <Button onClick={() => window.location.href = `/applications?edit=${id}`} variant="secondary">
              Edit
            </Button>
            <Button onClick={handleDelete} variant="danger">
              Delete
            </Button>
          </div>
        </div>

        <div className="app-header">
          <h1>{application.name}</h1>
          <div className="app-meta">
            <span className="meta-item">
              <span className="label">Domain:</span>
              <span className="value">{application.domain || 'N/A'}</span>
            </span>
            <span className="meta-item">
              <span className="label">Port:</span>
              <span className="value">{application.port || 'N/A'}</span>
            </span>
            <span className="meta-item">
              <span className="label">Branch:</span>
              <span className="value">{application.branch || 'main'}</span>
            </span>
          </div>
        </div>

        <div className="content-grid">
          <div className="logs-panel">
            <div className="panel-header">
              <h3>Deployment History</h3>
              <div className="panel-actions">
                <Button size="sm" variant="secondary" onClick={refreshLogs}>
                  Refresh
                </Button>
                {logs.length > 1 && (
                  <Button size="sm" variant="danger" onClick={clearHistory}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
            {logs.length === 0 ? (
              <div className="empty-logs">No deployments yet</div>
            ) : (
              <div className="logs-list">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`log-item ${selectedLog?.id === log.id ? 'selected' : ''}`}
                    onClick={() => selectLog(log)}
                  >
                    <div className="log-header">
                      <span className={`status-badge ${getStatusClass(log.status)}`}>
                        {log.status}
                      </span>
                      <span className="log-type">{getTypeLabel(log.type)}</span>
                    </div>
                    <div className="log-info">
                      <span className="log-date">{formatDate(log.startedAt)}</span>
                      <span className="log-by">by {log.triggeredBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="log-viewer">
            <div className="panel-header">
              <h3>
                {selectedLog ? (
                  <>
                    Log Output
                    <span className={`status-badge ${getStatusClass(selectedLog.status)}`}>
                      {selectedLog.status}
                    </span>
                  </>
                ) : (
                  'Select a deployment'
                )}
              </h3>
            </div>
            <div className="log-content">
              {isLoadingLog ? (
                <div className="loading-log">Loading log content...</div>
              ) : selectedLog ? (
                <pre>{logContent}</pre>
              ) : (
                <div className="no-log-selected">Select a deployment from the list to view logs</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
