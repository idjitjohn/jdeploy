import { useState, useCallback } from 'react'

type FileOperation = 'cp' | 'mv' | 'ln'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface FormData {
  id?: string
  name: string
  displayName: string
  description: string
  prebuild: string[]
  build: string[]
  deployment: string[]
  launch: string[]
  files: FileTransfer[]
  nginxConfig: string
  env: string
}

interface Errors {
  name?: string
  displayName?: string
  description?: string
}

export function useTemplateForm(initialData?: any) {
  const [formData, setFormData] = useState<FormData>({
    id: initialData?.id,
    name: initialData?.name || '',
    displayName: initialData?.displayName || '',
    description: initialData?.description || '',
    prebuild: initialData?.prebuild || [],
    build: initialData?.build || [],
    deployment: initialData?.deployment || [],
    launch: initialData?.launch || [],
    files: initialData?.files || [],
    nginxConfig: initialData?.nginxConfig || '',
    env: initialData?.env || ''
  })

  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = useCallback(() => {
    const newErrors: Errors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      newErrors.name = 'Template name must be lowercase alphanumeric with hyphens'
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async (onSubmit: (data: any) => Promise<void>) => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = {
        ...formData,
        prebuild: formData.prebuild.filter(c => c.trim()),
        build: formData.build.filter(c => c.trim()),
        deployment: formData.deployment.filter(c => c.trim()),
        launch: formData.launch.filter(c => c.trim()),
        files: formData.files
      }
      await onSubmit(submitData)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    validateForm,
    handleSubmit
  }
}
