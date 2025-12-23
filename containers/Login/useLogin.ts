import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { showNotification } from '@/lib/utils'

export function useLogin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await api.auth.login(formData.username, formData.password)
      showNotification('Login successful', 'success')
      router.push('/dashboard')
    } catch (error) {
      showNotification('Login failed: ' + (error as Error).message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit
  }
}
