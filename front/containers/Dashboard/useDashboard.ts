import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/front/lib/api'
import { checkAuth } from '@/front/lib/utils'
import { showNotification } from '@/front/components/Notification'

export function useDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    repositories: 0,
    domains: 0,
    templates: 0
  })
  const [processes, setProcesses] = useState([])
  const [systemStatus, setSystemStatus] = useState<any>(null)

  useEffect(() => {
    initDashboard()
  }, [])

  const initDashboard = async () => {
    try {
      await checkAuth()
      await Promise.all([
        loadStats(),
        loadProcesses(),
        loadSystemStatus()
      ])
    } catch (error) {
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const [repos, domains, templates] = await Promise.all([
        api.applications.list(),
        api.domains.list(),
        api.templates.list()
      ]) as any[]

      setStats({
        repositories: repos.repositories?.length || 0,
        domains: domains.domains?.length || 0,
        templates: templates.templates?.length || 0
      })
    } catch (error) {
      showNotification('Failed to load stats', 'error')
    }
  }

  const loadProcesses = async () => {
    try {
      const data = await api.system.pm2() as any
      setProcesses(data.processes || [])
    } catch (error) {
      showNotification('Failed to load processes', 'error')
    }
  }

  const loadSystemStatus = async () => {
    try {
      const data = await api.system.status() as any
      setSystemStatus(data)
    } catch (error) {
      showNotification('Failed to load system status', 'error')
    }
  }

  const refreshDashboard = () => {
    initDashboard()
  }

  return {
    isLoading,
    stats,
    processes,
    systemStatus,
    refreshDashboard
  }
}
