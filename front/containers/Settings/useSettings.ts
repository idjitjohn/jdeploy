import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/front/lib/api'
import { checkAuth } from '@/front/lib/utils'
import { showNotification } from '@/front/components/Notification'

interface Paths {
  home: string
}

export function useSettings() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [paths, setPaths] = useState<Paths>({
    home: '/var/webhooks'
  })

  useEffect(() => {
    initSettings()
  }, [])

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
      const home = data?.configuration?.home || data?.home || '/var/webhooks'
      setPaths({ home })
    } catch (error) {
      showNotification('Failed to load configuration: ' + (error as Error).message, 'error')
    }
  }

  return {
    isLoading,
    paths
  }
}
