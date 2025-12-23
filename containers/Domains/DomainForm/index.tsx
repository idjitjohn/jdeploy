'use client'

import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import { useDomainForm } from './useDomainForm'
import './DomainForm.scss'

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: {
    name: string
    certificate?: string
    privateKey?: string
  }
}

export default function DomainForm({ onSubmit, onCancel, initialData }: Props) {
  const {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit
  } = useDomainForm({ onSubmit, initialData })

  return (
    <form className="DomainForm" onSubmit={handleSubmit}>
      <Input
        label="Domain Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="example.com"
        required
      />

      <Textarea
        label="SSL Certificate (Optional)"
        name="certificate"
        value={formData.certificate}
        onChange={handleChange}
        placeholder="-----BEGIN CERTIFICATE-----"
        rows={6}
      />

      <Textarea
        label="Private Key (Optional)"
        name="privateKey"
        value={formData.privateKey}
        onChange={handleChange}
        placeholder="-----BEGIN PRIVATE KEY-----"
        rows={6}
      />

      <div className="actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update Domain' : 'Add Domain'}
        </Button>
      </div>
    </form>
  )
}
