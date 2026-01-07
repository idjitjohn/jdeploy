import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/front/lib/api'
import { checkAuth, showNotification } from '@/front/lib/utils'

type FileOperation = 'cp' | 'mv' | 'ln'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface Template {
  id: string
  name: string
  displayName: string
  description: string
  prebuild?: string[]
  build?: string[]
  deployment?: string[]
  launch?: string[]
  files?: FileTransfer[]
  nginxConfig?: string
  env?: string
}

export function useTemplates() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    initTemplates()
  }, [])

  const initTemplates = async () => {
    try {
      await checkAuth()
      await loadTemplates()
    } catch (error) {
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await api.templates.list() as any
      setTemplates(data.templates || [])
    } catch (error) {
      showNotification('Failed to load templates: ' + (error as Error).message, 'error')
    }
  }

  const handleAddTemplate = async (formData: any) => {
    try {
      await api.templates.create({
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        prebuild: formData.prebuild || [],
        build: formData.build || [],
        deployment: formData.deployment || [],
        launch: formData.launch || [],
        files: formData.files || [],
        nginxConfig: formData.nginxConfig || '',
        env: formData.env || ''
      })
      showNotification('Template created successfully', 'success')
      setShowAddModal(false)
      await loadTemplates()
    } catch (error) {
      showNotification('Failed to create template: ' + (error as Error).message, 'error')
    }
  }

  const handleUpdateTemplate = async (formData: any) => {
    try {
      await api.templates.update(formData.id, {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        prebuild: formData.prebuild || [],
        build: formData.build || [],
        deployment: formData.deployment || [],
        launch: formData.launch || [],
        files: formData.files || [],
        nginxConfig: formData.nginxConfig || '',
        env: formData.env || ''
      })
      showNotification('Template updated successfully', 'success')
      setViewingId(null)
      setViewingTemplate(null)
      await loadTemplates()
    } catch (error) {
      showNotification('Failed to update template: ' + (error as Error).message, 'error')
    }
  }

  const handleDeleteTemplate = async (id: string, name?: string) => {
    if (!confirm(`Are you sure you want to delete template "${name || 'this template'}"?`)) {
      return
    }

    try {
      await api.templates.delete(id)
      showNotification(`Template deleted`, 'success')
      setViewingId(null)
      setViewingTemplate(null)
      await loadTemplates()
    } catch (error) {
      showNotification('Delete failed: ' + (error as Error).message, 'error')
    }
  }

  const openAddModal = () => setShowAddModal(true)
  const closeAddModal = () => setShowAddModal(false)
  const openViewModal = (id: string) => {
    setViewingId(id)
    const template = templates.find(t => t.id === id)
    if (template) {
      setViewingTemplate(template)
    }
  }
  const closeViewModal = () => {
    setViewingId(null)
    setViewingTemplate(null)
  }

  return {
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
  }
}
