import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { checkAuth, showNotification } from '@/lib/utils'

interface Paths {
  home: string
  code: string
  release: string
  certificate: string
  logs: string
  nginxAvailable: string
  nginxEnabled: string
}

export function useSettings() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [paths, setPaths] = useState<Paths>({
    home: '/var/webhooks',
    code: '/var/webhooks/code',
    release: '/var/webhooks/release',
    certificate: '/var/webhooks/certificate',
    logs: '/var/webhooks/logs',
    nginxAvailable: '/etc/nginx/sites-available',
    nginxEnabled: '/etc/nginx/sites-enabled'
  })
  const [originalPaths, setOriginalPaths] = useState<Paths>(paths)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    initSettings()
  }, [])

  useEffect(() => {
    setHasChanges(JSON.stringify(paths) !== JSON.stringify(originalPaths))
  }, [paths, originalPaths])

  const initSettings = async () => {
    try {
      await checkAuth()
      await loadConfiguration()
    } catch (error) {
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadConfiguration = async () => {
    try {
      const data = await api.configuration.get() as any
      if (data.configuration) {
        setPaths(data.configuration.paths)
        setOriginalPaths(data.configuration.paths)
      }
    } catch (error) {
      showNotification('Failed to load configuration: ' + (error as Error).message, 'error')
    }
  }

  const handlePathChange = (key: keyof Paths, value: string) => {
    setPaths(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await api.configuration.update({ paths })
      setOriginalPaths(paths)
      showNotification('Configuration saved successfully', 'success')
    } catch (error) {
      showNotification('Failed to save configuration: ' + (error as Error).message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setPaths(originalPaths)
  }

  return {
    isLoading,
    paths,
    hasChanges,
    isSaving,
    handlePathChange,
    handleSave,
    handleReset
  }
}
