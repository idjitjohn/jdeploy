import { useState, useCallback } from 'react'

interface FormData {
  name: string
  displayName: string
  description: string
  commands: string[]
}

interface Errors {
  name?: string
  displayName?: string
  description?: string
  commands?: string
}

export function useTemplateForm(initialData?: any) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    displayName: initialData?.displayName || '',
    description: initialData?.description || '',
    commands: initialData?.commands || []
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
      await onSubmit({
        ...formData,
        commands: formData.commands.filter(c => c.trim())
      })
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
