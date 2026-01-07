'use client'

import Header from '@/front/components/Header'
import Button from '@/front/components/Button'
import { useDashboard } from './useDashboard'
import './Dashboard.scss'

export default function Dashboard() {
  const { isLoading, stats, processes, systemStatus, refreshDashboard } = useDashboard()

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="Dashboard">
        <Header />
        <main className="container">
          <div className="loading">Loading dashboard...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="Dashboard">
      <Header />
      <main className="container">
        <div className="header">
          <h2>Dashboard</h2>
          <Button onClick={refreshDashboard}>Refresh</Button>
        </div>

        <div className='first-row'>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Repositories</div>
              <div className="stat-value">{stats.repositories}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Domains</div>
              <div className="stat-value">{stats.domains}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Templates</div>
              <div className="stat-value">{stats.templates}</div>
            </div>
          </div>

          {systemStatus && (
            <div className="section system-status">
              <h3>System Status</h3>
              <div className="status-grid">
                <div className="status-item status">
                  <div className="status-content">
                    <div className="status-label">Status</div>
                    <div className="status-value">{systemStatus.status}</div>
                  </div>
                </div>
                <div className="status-item uptime">
                  <div className="status-content">
                    <div className="status-label">Uptime</div>
                    <div className="status-value">{formatUptime(systemStatus.uptime)}</div>
                  </div>
                </div>
                <div className="status-item env">
                  <div className="status-content">
                    <div className="status-label">Environment</div>
                    <div className="status-value">{systemStatus.environment}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="section processes">
            <h3>Running Processes</h3>
            {processes.length === 0 ? (
              <div className="empty-state">No processes running</div>
            ) : (
              <div className="processes-list">
                {processes.map((proc: any) => (
                  <div key={proc.name} className="process-item">
                    <div className="process-name">{proc.name}</div>
                    <div className="process-details">
                      PID: {proc.pid} | Status: {proc.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
