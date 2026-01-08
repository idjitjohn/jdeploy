'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/front/components/Header'
import Modal from '@/front/components/Modal'
import Button from '@/front/components/Button'
import RepositoryForm from './ApplicationForm'
import { formatDate, escapeHtml } from '@/front/lib/utils'
import { showNotification } from '@/front/components/Notification'
import { useRepositories } from './useApplications'
import { api } from '@/front/lib/api'
import './Repositories.scss'

interface Repository {
  id: string
  name: string
  domain?: string
  port?: number
  branch?: string
  repoUrl: string
  environment?: string
  createdAt: string
}

interface RepositoryRowProps {
  repo: Repository
  onEdit: (repo: Repository) => void
  onUpdate: () => void
}



function RepositoryRow({ repo, onEdit, onUpdate }: RepositoryRowProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleRowClick = () => {
    router.push(`/applications/${repo.id}`)
  }

  const handleBranchClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPopoverStyle({
        position: 'fixed',
        left: rect.left,
        bottom: window.innerHeight - rect.top + 4
      })
    }
    setIsOpen(!isOpen)
    try {
      const data = await api.applications.getBranches(repo.id) as any
      setBranches(data.branches || [])
    } catch (error) {
      showNotification('Failed to fetch branches: ' + (error as Error).message, 'error')
    }
  }

  const handleSelectBranch = async (e: React.MouseEvent, branch: string) => {
    e.stopPropagation()
    setIsOpen(false)
    if (branch !== repo.branch) {
      try {
        await api.applications.switchBranch(repo.id, branch)
        showNotification(`Switched to branch ${branch}`, 'success')
        onUpdate()
      } catch (error) {
        showNotification('Failed to switch branch: ' + (error as Error).message, 'error')
      }
    }
  }

  const handleRedeploy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to redeploy "${repo.name}"?`)) return
    try {
      showNotification(`Redeploying ${repo.name}...`, 'info')
      await fetch(`/api/applications/${repo.id}/redeploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      showNotification(`Repository ${repo.name} redeployed`, 'success')
      onUpdate()
    } catch (error) {
      showNotification('Redeploy failed: ' + (error as Error).message, 'error')
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
  }

  return (
    <tr onClick={handleRowClick} className="clickable-row">
      <td>
        <div className="app-name">
          <strong>{escapeHtml(repo.name)}</strong>
          <span className={`env-badge ${repo.environment || 'prod'}`}>{(repo.environment || 'prod').toUpperCase()}</span>
        </div>
      </td>
      <td>{escapeHtml(repo.domain || 'N/A')}</td>
      <td>{escapeHtml(String(repo.port || 'N/A'))}</td>
      <td>
        <div className="branch-selector">
          <button ref={btnRef} className="branch-btn" onClick={handleBranchClick}>
            {repo.branch || 'Branch...'}
          </button>
          {isOpen && (
            <>
              <div className="branch-overlay" onClick={handleClose} />
              <div className="branch-popover" style={popoverStyle}>
                {branches.length === 0 ? (
                  <div className="branch-loading">Loading...</div>
                ) : (
                  <ul className="branch-list">
                    {branches.map((branch) => (
                      <li
                        key={branch}
                        className={branch === repo.branch ? 'active' : ''}
                        onClick={(e) => handleSelectBranch(e, branch)}
                      >
                        {branch}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </td>
      <td>{formatDate(repo.createdAt)}</td>
      <td>
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={handleRedeploy}>Deploy</Button>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(repo) }}>Edit</Button>
        </div>
      </td>
    </tr>
  )
}

export default function Repositories() {
  const {
    isLoading,
    repositories,
    domains,
    templates,
    showAddModal,
    showEditModal,
    editingRepo,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    handleAddRepository,
    handleUpdateRepository,
    loadRepositories
  } = useRepositories()

  if (isLoading) {
    return (
      <div className="Repositories">
        <Header />
        <main className="container">
          <div className="loading">Loading repositories...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="Repositories">
      <Header />
      <main className="container">
        <div className="header">
          <h2>Applications</h2>
          <Button onClick={openAddModal}>+ Add Application</Button>
        </div>

        {repositories.length === 0 ? (
          <div className="empty-state">No repositories configured</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Port</th>
                <th>Branch</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo: Repository) => (
                <RepositoryRow
                  key={repo.id}
                  repo={repo}
                  onEdit={openEditModal}
                  onUpdate={loadRepositories}
                />
              ))}
            </tbody>
          </table>
        )}
      </main>

      <Modal isOpen={showAddModal} title="Add Application" onClose={closeAddModal} size="large">
        <RepositoryForm
          onSubmit={handleAddRepository}
          onCancel={closeAddModal}
          domains={domains}
          templates={templates}
        />
      </Modal>

      <Modal isOpen={showEditModal} title="Edit Application" onClose={closeEditModal} size="large">
        <RepositoryForm
          onSubmit={handleUpdateRepository}
          onCancel={closeEditModal}
          domains={domains}
          templates={templates}
          initialData={editingRepo || undefined}
        />
      </Modal>
    </div>
  )
}
