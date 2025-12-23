'use client'

import Header from '@/components/Header'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import DomainForm from './DomainForm'
import { escapeHtml } from '@/lib/utils'
import { useDomains } from './useDomains'
import './Domains.scss'

interface Domain {
  id: string
  name: string
}

export default function Domains() {
  const {
    isLoading,
    domains,
    showAddModal,
    showEditModal,
    editingDomain,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    handleAddDomain,
    handleUpdateDomain,
    handleDeleteDomain
  } = useDomains()

  if (isLoading) {
    return (
      <div className="Domains">
        <Header />
        <main className="container">
          <div className="loading">Loading domains...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="Domains">
      <Header />
      <main className="container">
        <div className="header">
          <h2>Domains</h2>
          <Button onClick={openAddModal}>+ Add Domain</Button>
        </div>

        <div className="grid">
          {domains.length === 0 ? (
            <div className="empty-state">No domains configured</div>
          ) : (
            domains.map((domain: Domain) => (
              <div key={domain.id} className="card">
                <h3 className="card-title">{escapeHtml(domain.name)}</h3>
                <div className="card-actions">
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(domain)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteDomain(domain.id, domain.name)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Modal isOpen={showAddModal} title="Add Domain" onClose={closeAddModal} size="medium">
        <DomainForm onSubmit={handleAddDomain} onCancel={closeAddModal} />
      </Modal>

      <Modal isOpen={showEditModal} title="Edit Domain" onClose={closeEditModal} size="medium">
        <DomainForm 
          onSubmit={handleUpdateDomain} 
          onCancel={closeEditModal} 
          initialData={editingDomain || undefined}
        />
      </Modal>
    </div>
  )
}
