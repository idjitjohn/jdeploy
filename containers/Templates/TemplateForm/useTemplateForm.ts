import { useState, useCallback } from 'react'

interface FormData {
  id?: string
  name: string
  displayName: string
  description: string
  prebuild: string[]
  preDeploy?: string[]
  postDeploy?: string[]
  nginxConfig?: string
  env?: string
}

interface Errors {
  name?: string
  displayName?: string
  description?: string
  commands?: string
}

export function useTemplateForm(initialData?: any) {
  const [formData, setFormData] = useState<FormData>({
    id: initialData?.id,
    name: initialData?.name || '',
    displayName: initialData?.displayName || '',
    description: initialData?.description || '',
    prebuild: initialData?.prebuild || [],
    prebuild: initialData?.prebuild || [],
    launch: initialData?.launch || [],
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
      const filteredCommands = formData.prebuild.filter(c => c.trim())
      const filteredPreDeploy = formData.prebuild?.filter(c => c.trim()) || []
      const filteredPostDeploy = formData.launch?.filter(c => c.trim()) || []
      const submitData = {
        ...formData,
        prebuild: filteredCommands,
        prebuild: filteredPreDeploy,
        launch: filteredPostDeploy
      }
      console.log('Submitting template data:', submitData)
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
