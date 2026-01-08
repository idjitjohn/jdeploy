import { useEffect, useState, useCallback, useRef, RefObject } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/front/lib/api'
import { checkAuth } from '@/front/lib/utils'
import { showNotification } from '@/front/components/Notification'

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
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef<boolean>(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

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
      const logsList = Array.isArray(data) ? data : (data.logs || [])
      setLogs(logsList)
      if (logsList.length > 0 && !selectedLog) {
        selectLog(logsList[0])
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const loadLogsForApp = useCallback(async (appName: string) => {
    try {
      const data = await api.logs.list(appName, { limit: '20' }) as any
      const logsList = Array.isArray(data) ? data : (data.logs || [])
      setLogs(logsList)
      if (logsList.length > 0) {
        selectLog(logsList[0])
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

  const scrollLogToBottom = useCallback(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [])

  const fetchLogContent = useCallback(async (logId: string) => {
    try {
      const contentData = await fetch(`/api/logs/deployment/${logId}/content`).then(r => r.json())
      setLogContent(contentData.content || 'No log content available')
      // Scroll to bottom after content update
      setTimeout(scrollLogToBottom, 50)
    } catch (error) {
      setLogContent('Failed to load log content')
    }
  }, [scrollLogToBottom])

  const stopPolling = useCallback(() => {
    isPollingRef.current = false
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
  }, [])

  const pollOnce = useCallback(async (logId: string, appName: string) => {
    if (!isPollingRef.current) return

    await fetchLogContent(logId)

    // Also refresh logs list to get updated status
    try {
      const data = await api.logs.list(appName, { limit: '20' }) as any
      const logsList = Array.isArray(data) ? data : (data.logs || [])
      setLogs(logsList)
      // Update selected log status from refreshed list
      const updatedLog = logsList.find((l: DeploymentLog) => l.id === logId)
      if (updatedLog) {
        setSelectedLog(updatedLog)
        // Stop polling if no longer running
        if (updatedLog.status !== 'running') {
          stopPolling()
          setIsRedeploying(false)
          return
        }
      }
    } catch (error) {
      console.error('Failed to refresh logs:', error)
    }

    // Schedule next poll after 1 second
    if (isPollingRef.current) {
      pollingTimeoutRef.current = setTimeout(() => pollOnce(logId, appName), 200)
    }
  }, [fetchLogContent, stopPolling])

  const startPolling = useCallback((logId: string, appName: string) => {
    stopPolling()
    isPollingRef.current = true
    pollOnce(logId, appName)
  }, [pollOnce, stopPolling])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // Start/stop polling based on selected log status
  useEffect(() => {
    if (selectedLog?.status === 'running' && application?.name) {
      startPolling(selectedLog.id, application.name)
    } else {
      stopPolling()
    }
  }, [selectedLog?.id, selectedLog?.status, application?.name, startPolling, stopPolling])

  const selectLog = async (log: DeploymentLog) => {
    setSelectedLog(log)
    setIsLoadingLog(true)
    try {
      await fetchLogContent(log.id)
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
      const response = await fetch(`/api/applications/${id}/redeploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()

      if (data.log) {
        // Add new log to list and select it
        const newLog: DeploymentLog = {
          id: data.log.id,
          application: data.log.application,
          branch: data.log.branch,
          type: data.log.type,
          status: data.log.status,
          triggeredBy: data.log.triggeredBy,
          startedAt: data.log.startedAt,
          logFile: data.log.logFile
        }
        setLogs(prev => [newLog, ...prev])
        setSelectedLog(newLog)
        setLogContent('Deployment starting...')
        // Polling will start automatically via useEffect when selectedLog.status === 'running'
      }
    } catch (error) {
      showNotification('Redeploy failed: ' + (error as Error).message, 'error')
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
      const response = await fetch(`/api/logs/app/${application.name}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.deletedCount > 0) {
        showNotification(`Cleared ${data.deletedCount} old log(s)`, 'success')
      } else {
        showNotification('No old logs to clear', 'info')
      }
      // Always reload logs list after clearing
      loadLogsForApp(application.name)
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
    logContainerRef,
    selectLog,
    handleRedeploy,
    handleDelete,
    refreshLogs,
    clearHistory,
    goBack
  }
}
