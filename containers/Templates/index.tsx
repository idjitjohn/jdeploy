'use client'

import Header from '@/components/Header'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import TemplateForm from './TemplateForm'
import TemplateCard from './TemplateCard'
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
              <TemplateCard
                key={template.id}
                id={template.id}
                displayName={template.displayName}
                description={template.description}
                isSystem={template.isSystem}
                onEdit={() => openViewModal(template.id)}
                onDelete={() => handleDeleteTemplate(template.id, template.displayName)}
              />
            ))
          )}
        </div>
      </main>

      <Modal isOpen={showAddModal} title="Create Template" onClose={closeAddModal} size="large">
        <TemplateForm
          onSubmit={handleAddTemplate}
          onCancel={closeAddModal}
          availableTemplates={templates}
        />
      </Modal>

      <Modal isOpen={!!viewingId} title={viewingTemplate ? `Edit ${viewingTemplate.displayName}` : ''} onClose={closeViewModal} size="large">
        {viewingTemplate && (
          <TemplateForm
            initialData={viewingTemplate}
            onSubmit={async (data) => {
              await handleUpdateTemplate(data)
              closeViewModal()
            }}
            onCancel={closeViewModal}
          />
        )}
      </Modal>
    </div>
  )
}
