import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/front/lib/api'
import { checkAuth, showNotification } from '@/front/lib/utils'

interface Domain {
  id: string
  name: string
  certificate?: string
  privateKey?: string
}

export function useDomains() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [domains, setDomains] = useState<Domain[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)

  useEffect(() => {
    initDomains()
  }, [])

  const initDomains = async () => {
    try {
      await checkAuth()
      await loadDomains()
    } catch (error) {
      router.push('/')
    } finally {
      setIsLoading(false)
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

  const handleAddDomain = async (formData: any) => {
    try {
      await api.domains.create({
        name: formData.name
      })
      showNotification('Domain created successfully', 'success')
      setShowAddModal(false)
      await loadDomains()
    } catch (error) {
      showNotification('Failed to create domain: ' + (error as Error).message, 'error')
    }
  }

  const handleDeleteDomain = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete domain "${name}"?`)) {
      return
    }

    try {
      await api.domains.delete(id)
      showNotification(`Domain ${name} deleted`, 'success')
      await loadDomains()
    } catch (error) {
      showNotification('Delete failed: ' + (error as Error).message, 'error')
    }
  }

  const handleUpdateDomain = async (formData: any) => {
    if (!editingDomain) return

    try {
      await api.domains.update(editingDomain.id, {
        name: formData.name,
        certificate: formData.certificate,
        privateKey: formData.privateKey
      })
      showNotification('Domain updated successfully', 'success')
      setShowEditModal(false)
      setEditingDomain(null)
      await loadDomains()
    } catch (error) {
      showNotification('Failed to update domain: ' + (error as Error).message, 'error')
    }
  }

  const openAddModal = () => setShowAddModal(true)
  const closeAddModal = () => setShowAddModal(false)

  const openEditModal = (domain: Domain) => {
    setEditingDomain(domain)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingDomain(null)
  }

  return {
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
  }
}
