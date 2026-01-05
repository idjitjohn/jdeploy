import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { checkAuth, showNotification } from '@/lib/utils'

type FileOperation = 'cp' | 'mv' | 'ln'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface Application {
  id: string
  name: string
  repoUrl: string
  domain?: string
  port?: number
  branch?: string
  template?: string
  prebuild?: string[]
  build?: string[]
  deployment?: string[]
  launch?: string[]
  files?: FileTransfer[]
  nginxConfig?: string
  env?: string
  envFilePath?: string
  createdAt?: string
  updatedAt?: string
}

interface DeploymentLog {
  id: string
  application: string
  branch: string
  type: 'webhook' | 'manual' | 'cli' | 'initial'
  status: 'pending' | 'running' | 'success' | 'failed'
  triggeredBy: string
  startedAt: string
  completedAt?: string
  exitCode?: number
  logFile?: string
  errorMessage?: string
}

export function useApplicationDetail(id: string) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<Application | null>(null)
  const [logs, setLogs] = useState<DeploymentLog[]>([])
  const [selectedLog, setSelectedLog] = useState<DeploymentLog | null>(null)
  const [logContent, setLogContent] = useState<string>('')
  const [isLoadingLog, setIsLoadingLog] = useState(false)
  const [isRedeploying, setIsRedeploying] = useState(false)

  useEffect(() => {
    initDetail()
  }, [id])

  const initDetail = async () => {
    try {
      await checkAuth()
      await Promise.all([loadApplication(), loadLogs()])
    } catch (error) {
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadApplication = async () => {
    try {
      const data = await api.applications.get(id) as any
      setApplication(data.application)
    } catch (error) {
      showNotification('Failed to load application: ' + (error as Error).message, 'error')
      router.push('/applications')
    }
  }

  const loadLogs = async () => {
    if (!application?.name) return
    try {
      const data = await api.logs.list(application.name, { limit: '20' }) as any
      setLogs(data.logs || [])
      if (data.logs?.length > 0 && !selectedLog) {
        selectLog(data.logs[0])
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const loadLogsForApp = useCallback(async (appName: string) => {
    try {
      const data = await api.logs.list(appName, { limit: '20' }) as any
      setLogs(data.logs || [])
      if (data.logs?.length > 0) {
        selectLog(data.logs[0])
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }, [])

  useEffect(() => {
    if (application?.name) {
      loadLogsForApp(application.name)
    }
  }, [application?.name, loadLogsForApp])

  const selectLog = async (log: DeploymentLog) => {
    setSelectedLog(log)
    setIsLoadingLog(true)
    try {
      const data = await api.logs.get(log.id) as any
      if (data.content) {
        setLogContent(data.content)
      } else {
        const contentData = await fetch(`/api/logs/deployment/${log.id}/content`).then(r => r.json())
        setLogContent(contentData.content || 'No log content available')
      }
    } catch (error) {
      setLogContent('Failed to load log content')
    } finally {
      setIsLoadingLog(false)
    }
  }

  const handleRedeploy = async () => {
    if (!application) return
    
    if (!confirm(`Are you sure you want to redeploy "${application.name}"?`)) {
      return
    }

    setIsRedeploying(true)
    try {
      showNotification(`Redeploying ${application.name}...`, 'info')
      await fetch(`/api/applications/${id}/redeploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      showNotification(`Deployment started for ${application.name}`, 'success')
      // Reload logs after a short delay
      setTimeout(() => {
        if (application.name) {
          loadLogsForApp(application.name)
        }
      }, 2000)
    } catch (error) {
      showNotification('Redeploy failed: ' + (error as Error).message, 'error')
    } finally {
      setIsRedeploying(false)
    }
  }

  const handleDelete = async () => {
    if (!application) return
    
    if (!confirm(`Are you sure you want to delete "${application.name}"? This will remove all files and logs.`)) {
      return
    }

    try {
      await api.applications.delete(id)
      showNotification(`Application ${application.name} deleted`, 'success')
      router.push('/applications')
    } catch (error) {
      showNotification('Delete failed: ' + (error as Error).message, 'error')
    }
  }

  const refreshLogs = () => {
    if (application?.name) {
      loadLogsForApp(application.name)
    }
  }

  const clearHistory = async () => {
    if (!application?.name) return
    
    if (!confirm('Clear all deployment history except the latest one?')) {
      return
    }

    try {
      const response = await fetch(`/api/logs/${application.name}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.deleted > 0) {
        showNotification(`Cleared ${data.deleted} old log(s)`, 'success')
        loadLogsForApp(application.name)
      } else {
        showNotification('No old logs to clear', 'info')
      }
    } catch (error) {
      showNotification('Failed to clear history: ' + (error as Error).message, 'error')
    }
  }

  const goBack = () => {
    router.push('/applications')
  }

  return {
    isLoading,
    application,
    logs,
    selectedLog,
    logContent,
    isLoadingLog,
    isRedeploying,
    selectLog,
    handleRedeploy,
    handleDelete,
    refreshLogs,
    clearHistory,
    goBack
  }
}
