import { useState, FormEvent, ChangeEvent, useCallback, useRef, useEffect } from 'react'
import { api } from '@/front/lib/api'

type FileOperation = 'cp' | 'mv' | 'ln' | 'rm'

export interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface FormDataType {
  id?: string
  name: string
  repoUrl: string
  subdomain: string
  domain: string
  port: string
  template: string
  prebuild?: string[]
  build?: string[]
  deployment?: string[]
  launch?: string[]
  files?: FileTransfer[]
  nginxConfig?: string
  env?: string
  envFilePath?: string
  environment?: string
}

interface ValidationErrors {
  name?: string
  subdomain?: string
  port?: string
}

interface UseRepositoryFormProps {
  onSubmit: (data: any) => void
  initialData?: {
    id?: string
    name: string
    repoUrl: string
    subdomain?: string
    domain?: string
    port?: number
    template?: string
    prebuild?: string[]
    build?: string[]
    deployment?: string[]
    launch?: string[]
    files?: FileTransfer[]
    nginxConfig?: string
    env?: string
    envFilePath?: string
    environment?: string
  }
}

export function useRepositoryForm({ onSubmit, initialData }: UseRepositoryFormProps) {
  const isEdit = !!initialData?.id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  const [formData, setFormData] = useState<FormDataType>({
    id: initialData?.id,
    name: initialData?.name || '',
    repoUrl: initialData?.repoUrl || '',
    subdomain: initialData?.subdomain || '',
    domain: initialData?.domain || '',
    port: initialData?.port?.toString() || '',
    template: initialData?.template || '',
    prebuild: initialData?.prebuild || [],
    build: initialData?.build || [],
    deployment: initialData?.deployment || [],
    launch: initialData?.launch || [],
    files: initialData?.files || [],
    nginxConfig: initialData?.nginxConfig || '',
    env: initialData?.env || '',
    envFilePath: initialData?.envFilePath || '.env',
    environment: initialData?.environment || 'prod'
  })

  // Debounced validation functions
  const validateName = useCallback(async (name: string) => {
    if (!name || isEdit) return

    setIsValidating(prev => ({ ...prev, name: true }))
    try {
      const result = await api.applications.checkName(name, formData.id) as any
      if (!result.available) {
        setErrors(prev => ({ ...prev, name: result.message }))
      } else {
        setErrors(prev => ({ ...prev, name: undefined }))
      }
    } catch (error) {
      console.error('Name validation error:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, name: false }))
    }
  }, [formData.id, isEdit])

  const validateSubdomain = useCallback(async (subdomain: string, domain: string) => {
    if (!domain) return

    setIsValidating(prev => ({ ...prev, subdomain: true }))
    try {
      const result = await api.applications.checkSubdomain(subdomain, domain, formData.id) as any
      if (!result.available) {
        setErrors(prev => ({ ...prev, subdomain: result.message }))
      } else {
        setErrors(prev => ({ ...prev, subdomain: undefined }))
      }
    } catch (error) {
      console.error('Subdomain validation error:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, subdomain: false }))
    }
  }, [formData.id])

  const validatePort = useCallback(async (port: string) => {
    const portNum = parseInt(port, 10)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) return

    setIsValidating(prev => ({ ...prev, port: true }))
    try {
      const result = await api.applications.checkPort(portNum, formData.id) as any
      if (!result.available) {
        setErrors(prev => ({ ...prev, port: result.message }))
      } else {
        setErrors(prev => ({ ...prev, port: undefined }))
      }
    } catch (error) {
      console.error('Port validation error:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, port: false }))
    }
  }, [formData.id])

  // Debounce helper
  const debounce = (key: string, fn: () => void, delay: number = 500) => {
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }
    debounceTimers.current[key] = setTimeout(fn, delay)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }

      // Trigger validations with debounce
      if (name === 'name' && !isEdit) {
        debounce('name', () => validateName(value))
      } else if (name === 'subdomain') {
        debounce('subdomain', () => validateSubdomain(value, newData.domain))
      } else if (name === 'domain' && newData.subdomain) {
        debounce('subdomain', () => validateSubdomain(newData.subdomain, value))
      } else if (name === 'port') {
        debounce('port', () => validatePort(value))
      }

      return newData
    })
  }

  const hasErrors = Object.values(errors).some(e => !!e)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (hasErrors) return

    setIsSubmitting(true)
    
    try {
      await onSubmit({
        ...formData,
        port: parseInt(formData.port, 10)
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer))
    }
  }, [])

  return {
    formData,
    isSubmitting,
    errors,
    isValidating,
    hasErrors,
    handleChange,
    handleSubmit,
    setFormData
  }
}
