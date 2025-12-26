'use client'

import Header from '@/components/Header'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import RepositoryForm from './ApplicationForm'
import { formatDate, escapeHtml } from '@/lib/utils'
import { useRepositories } from './useApplications'
import './Repositories.scss'

interface Repository {
  id: string
  name: string
  domain?: string
  port?: number
  branches?: Record<string, any>
  repoUrl: string
  createdAt: string
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
    handleDeleteRepository,
    handleRedeployRepository
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
                <th>Branches</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo: Repository) => (
                <tr key={repo.id}>
                  <td><strong>{escapeHtml(repo.name)}</strong></td>
                  <td>{escapeHtml(repo.domain || 'N/A')}</td>
                  <td>{escapeHtml(String(repo.port || 'N/A'))}</td>
                  <td>{repo.branches ? Object.keys(repo.branches).length : 0}</td>
                  <td>{formatDate(repo.createdAt)}</td>
                  <td>
                    <div className="actions-cell">
                      <Button size="sm" onClick={() => handleRedeployRepository(repo.id, repo.name)}>Redeploy</Button>
                      <Button size="sm" variant="secondary" onClick={() => openEditModal(repo)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteRepository(repo.id, repo.name)}>Delete</Button>
                    </div>
                  </td>
                </tr>
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
