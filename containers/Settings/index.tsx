'use client'

import Header from '@/components/Header'
import { useSettings } from './useSettings'
import './Settings.scss'

export default function Settings() {
  const { isLoading, paths } = useSettings()

  if (isLoading) {
    return (
      <div className="Settings">
        <Header />
        <main className="container">
          <div className="loading">Loading settings...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="Settings">
      <Header />
      <main className="container">
        <div className="header">
          <h2>System Configuration</h2>
        </div>

        <div className="section paths-section">
          <h3>Deployment Paths</h3>
          <p className="description">Configure the base directory for all deployments. Other paths are inferred from this.</p>

          <div className="home-path">
            <label>Home Directory</label>
            <div className="path-value">{paths.home}</div>
            <p className="hint">Base directory for all deployments</p>
          </div>

          <div className="inferred-paths">
            <h4>Inferred Paths</h4>
            <ul>
              <li><strong>Code:</strong> {paths.home}/code</li>
              <li><strong>Release:</strong> {paths.home}/release</li>
              <li><strong>Certificate:</strong> {paths.home}/certificate</li>
              <li><strong>Logs:</strong> {paths.home}/logs</li>
              <li><strong>Nginx Available:</strong> {paths.home}/nginx/sites-available</li>
              <li><strong>Nginx Enabled:</strong> {paths.home}/nginx/sites-enabled</li>
            </ul>
          </div>
        </div>

        <div className="section info-section">
          <h3>Information</h3>
          <div className="info-box">
            <p>
              <strong>Important:</strong> Changing the home path will affect where the system stores code repositories,
              deployment releases, SSL certificates, and logs. Make sure the directory exists and has proper permissions
              before saving.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
