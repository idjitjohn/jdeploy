import { useState, FormEvent, ChangeEvent, Dispatch, SetStateAction } from 'react'

type FileOperation = 'cp' | 'mv' | 'ln'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface FormDataType {
  id?: string
  name: string
  repoUrl: string
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
}

interface UseRepositoryFormProps {
  onSubmit: (data: any) => void
  initialData?: {
    id?: string
    name: string
    repoUrl: string
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
  }
}

export function useRepositoryForm({ onSubmit, initialData }: UseRepositoryFormProps) {
  console.log('[useRepositoryForm] initialData.files:', JSON.stringify(initialData?.files))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormDataType>({
    id: initialData?.id,
    name: initialData?.name || '',
    repoUrl: initialData?.repoUrl || '',
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
    envFilePath: initialData?.envFilePath || '.env'
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
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

  return {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData
  }
}
