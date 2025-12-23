'use client'

import Header from '@/components/Header'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import { escapeHtml } from '@/lib/utils'
import TemplateForm from './TemplateForm'
import TemplateView from './TemplateView'
import { useTemplates } from './useTemplates'
import './Templates.scss'

interface Template {
  id: string
  displayName: string
  description: string
  isSystem?: boolean
  commands?: string[]
}

export default function Templates() {
  const {
    isLoading,
    templates,
    showAddModal,
    viewingId,
    viewingTemplate,
    openAddModal,
    closeAddModal,
    openViewModal,
    closeViewModal,
    handleAddTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate
  } = useTemplates()

  if (isLoading) {
    return (
      <div className="Templates">
        <Header />
        <main className="container">
          <div className="loading">Loading templates...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="Templates">
      <Header />
      <main className="container">
        <div className="header">
          <h2>Templates</h2>
          <Button onClick={openAddModal}>+ Create Template</Button>
        </div>

        <div className="grid">
          {templates.length === 0 ? (
            <div className="empty-state">No templates configured</div>
          ) : (
            templates.map((template: Template) => (
              <div key={template.id} className="card">
                <div className="card-header">
                  <h3>{escapeHtml(template.displayName)}</h3>
                  <Badge size='sm' variant={template.isSystem ? 'neutral' : 'primary'}>
                    {template.isSystem ? 'System' : 'Custom'}
                  </Badge>
                </div>
                <div className="card-body">
                  <p className="description">{escapeHtml(template.description)}</p>
                </div>
                <div className="card-actions">
                  <Button size="sm" onClick={() => openViewModal(template.id)}>View</Button>
                  {!template.isSystem && (
                    <>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteTemplate(template.id, template.displayName)}>Delete</Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Modal isOpen={showAddModal} title="Create Template" onClose={closeAddModal} size="large">
        <TemplateForm
          onSubmit={handleAddTemplate}
          onCancel={closeAddModal}
        />
      </Modal>

      <Modal isOpen={!!viewingId} title={viewingTemplate?.displayName || ''} onClose={closeViewModal} size="large">
        {viewingTemplate && (
          <TemplateView
            template={viewingTemplate}
            onClose={closeViewModal}
            onEdit={handleUpdateTemplate}
            onDelete={handleDeleteTemplate}
          />
        )}
      </Modal>
    </div>
  )
}
