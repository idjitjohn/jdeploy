import { useState, FormEvent, ChangeEvent } from 'react'

interface UseDomainFormProps {
  onSubmit: (data: any) => void
  initialData?: {
    name: string
    certificate?: string
    privateKey?: string
  }
}

export function useDomainForm({ onSubmit, initialData }: UseDomainFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    certificate: initialData?.certificate || '',
    privateKey: initialData?.privateKey || ''
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit
  }
}
