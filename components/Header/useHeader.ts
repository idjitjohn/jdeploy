import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { showNotification } from '@/lib/utils'

export function useHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await api.auth.logout()
      showNotification('Logged out successfully', 'success')
      router.push('/')
    } catch (error) {
      showNotification('Logout failed: ' + (error as Error).message, 'error')
    }
  }

  const isActive = (path: string) => pathname === path ? 'active' : ''

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/repositories', label: 'Applications' },
    { href: '/domains', label: 'Domains' },
    { href: '/templates', label: 'Templates' },
    { href: '/logs', label: 'Logs' },
    { href: '/settings', label: 'Settings' }
  ]

  return {
    handleLogout,
    isActive,
    navLinks
  }
}
