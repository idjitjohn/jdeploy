import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { checkAuth, showNotification } from '@/lib/utils'

interface Repository {
  id: string
  name: string
  domain?: string
  port?: number
  template?: string
  branches?: Record<string, any>
  repoUrl: string
  createdAt: string
}

interface Domain {
  id: string
  name: string
}

interface Template {
  id: string
  displayName: string
  commands?: string[]
  description?: string
}

export function useRepositories() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    initRepositories()
  }, [])

  const initRepositories = async () => {
    try {
      await checkAuth()
      await loadRepositories()
      await loadDomains()
      await loadTemplates()
    } catch (error) {
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRepositories = async () => {
    try {
      const data = await api.repositories.list() as any
      setRepositories(data.repositories || [])
    } catch (error) {
      showNotification('Failed to load repositories: ' + (error as Error).message, 'error')
    }
  }

  const loadDomains = async () => {
    try {
      const data = await api.domains.list() as any
      setDomains(data.domains || [])
    } catch (error) {
      showNotification('Failed to load domains: ' + (error as Error).message, 'error')
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

  const handleAddRepository = async (formData: any) => {
    try {
      await api.repositories.create({
        name: formData.name,
        repoUrl: formData.repoUrl,
        domain: formData.domain,
        port: formData.port,
        template: formData.template
      })
      showNotification('Repository created successfully', 'success')
      setShowAddModal(false)
      await loadRepositories()
    } catch (error) {
      showNotification('Failed to create repository: ' + (error as Error).message, 'error')
    }
  }

  const handleUpdateRepository = async (formData: any) => {
    if (!editingRepo) return

    try {
      await api.repositories.update(editingRepo.id, {
        name: formData.name,
        repoUrl: formData.repoUrl,
        domain: formData.domain,
        port: formData.port,
        template: formData.template
      })
      showNotification('Repository updated successfully', 'success')
      setShowEditModal(false)
      setEditingRepo(null)
      await loadRepositories()
    } catch (error) {
      showNotification('Failed to update repository: ' + (error as Error).message, 'error')
    }
  }

  const handleDeleteRepository = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete repository "${name}"?`)) {
      return
    }

    try {
      await api.repositories.delete(id)
      showNotification(`Repository ${name} deleted`, 'success')
      await loadRepositories()
    } catch (error) {
      showNotification('Delete failed: ' + (error as Error).message, 'error')
    }
  }

  const handleRedeployRepository = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to redeploy "${name}"?`)) {
      return
    }

    try {
      showNotification(`Redeploying ${name}...`, 'info')
      await fetch(`/api/repositories/${id}/redeploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      showNotification(`Repository ${name} redeployed`, 'success')
      await loadRepositories()
    } catch (error) {
      showNotification('Redeploy failed: ' + (error as Error).message, 'error')
    }
  }

  const openAddModal = () => setShowAddModal(true)
  const closeAddModal = () => setShowAddModal(false)

  const openEditModal = (repo: Repository) => {
    setEditingRepo(repo)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingRepo(null)
  }

  return {
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
  }
}
