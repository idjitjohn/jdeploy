'use client'

import Header from '@/components/Header'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { useSettings } from './useSettings'
import './Settings.scss'

export default function Settings() {
  const {
    isLoading,
    paths,
    hasChanges,
    isSaving,
    handlePathChange,
    handleSave,
    handleReset
  } = useSettings()

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
          <p className="description">Configure the base directories for code, releases, and certificates</p>

          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-group">
                <Input
                  label="Home Directory"
                  name="home"
                  type="text"
                  value={paths.home}
                  onChange={(e) => handlePathChange('home', e.target.value)}
                  placeholder="/var/webhooks"
                />
                <p className="hint">Base directory for all deployments</p>
              </div>

              <div className="form-group">
                <Input
                  label="Code Directory"
                  name="code"
                  type="text"
                  value={paths.code}
                  onChange={(e) => handlePathChange('code', e.target.value)}
                  placeholder="/var/webhooks/code"
                />
                <p className="hint">Where to clone git repositories</p>
              </div>

              <div className="form-group">
                <Input
                  label="Release Directory"
                  name="release"
                  type="text"
                  value={paths.release}
                  onChange={(e) => handlePathChange('release', e.target.value)}
                  placeholder="/var/webhooks/release"
                />
                <p className="hint">Where to store compiled/built releases</p>
              </div>

              <div className="form-group">
                <Input
                  label="Certificate Directory"
                  name="certificate"
                  type="text"
                  value={paths.certificate}
                  onChange={(e) => handlePathChange('certificate', e.target.value)}
                  placeholder="/var/webhooks/certificate"
                />
                <p className="hint">Where to store SSL certificates</p>
              </div>

              <div className="form-group">
                <Input
                  label="Logs Directory"
                  name="logs"
                  type="text"
                  value={paths.logs}
                  onChange={(e) => handlePathChange('logs', e.target.value)}
                  placeholder="/var/webhooks/logs"
                />
                <p className="hint">Where to store deployment logs</p>
              </div>

              <div className="form-group">
                <Input
                  label="Nginx Sites Available"
                  name="nginxAvailable"
                  type="text"
                  value={paths.nginxAvailable}
                  onChange={(e) => handlePathChange('nginxAvailable', e.target.value)}
                  placeholder="/etc/nginx/sites-available"
                />
                <p className="hint">Nginx sites-available directory</p>
              </div>

              <div className="form-group">
                <Input
                  label="Nginx Sites Enabled"
                  name="nginxEnabled"
                  type="text"
                  value={paths.nginxEnabled}
                  onChange={(e) => handlePathChange('nginxEnabled', e.target.value)}
                  placeholder="/etc/nginx/sites-enabled"
                />
                <p className="hint">Nginx sites-enabled directory</p>
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </div>

        <div className="section info-section">
          <h3>Information</h3>
          <div className="info-box">
            <p>
              <strong>Important:</strong> Changing these paths will affect where the system stores code repositories,
              deployment releases, SSL certificates, and logs. Make sure these directories exist and have proper permissions
              before saving.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
