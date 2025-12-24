import { useState, FormEvent, ChangeEvent, Dispatch, SetStateAction } from 'react'

interface FormDataType {
  id?: string
  name: string
  repoUrl: string
  domain: string
  port: string
  template: string
  commands?: string[]
  preDeploy?: string[]
  postDeploy?: string[]
  nginxConfig?: string
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
    commands?: string[]
    preDeploy?: string[]
    postDeploy?: string[]
    nginxConfig?: string
  }
}

export function useRepositoryForm({ onSubmit, initialData }: UseRepositoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormDataType>({
    id: initialData?.id,
    name: initialData?.name || '',
    repoUrl: initialData?.repoUrl || '',
    domain: initialData?.domain || '',
    port: initialData?.port?.toString() || '',
    template: initialData?.template || '',
    commands: initialData?.commands || [],
    preDeploy: initialData?.preDeploy || [],
    postDeploy: initialData?.postDeploy || [],
    nginxConfig: initialData?.nginxConfig || ''
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
