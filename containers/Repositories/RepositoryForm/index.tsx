'use client'

import Input from '@/components/Input'
import Select from '@/components/Select'
import Button from '@/components/Button'
import { useRepositoryForm } from './useRepositoryForm'
import './RepositoryForm.scss'

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
  domains: Array<{ id: string; name: string }>
  templates: Array<{ id: string; displayName: string }>
  initialData?: {
    id?: string
    name: string
    repoUrl: string
    domain?: string
    port?: number
    template?: string
  }
}

export default function RepositoryForm({ onSubmit, onCancel, domains, templates, initialData }: Props) {
  const {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit
  } = useRepositoryForm({ onSubmit, initialData })

  return (
    <form className="RepositoryForm" onSubmit={handleSubmit}>
      <Input
        label="Repository Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="my-app"
        required
      />

      <Input
        label="Repository URL"
        name="repoUrl"
        value={formData.repoUrl}
        onChange={handleChange}
        placeholder="https://github.com/user/repo.git"
        required
      />

      <Select
        label="Domain"
        name="domain"
        value={formData.domain}
        onChange={handleChange}
        required
      >
        <option value="">Select a domain</option>
        {domains.map(domain => (
          <option key={domain.id} value={domain.name}>
            {domain.name}
          </option>
        ))}
      </Select>

      <Input
        label="Port"
        name="port"
        type="number"
        value={formData.port}
        onChange={handleChange}
        placeholder="3000"
        required
      />

      <Select
        label="Template"
        name="template"
        value={formData.template}
        onChange={handleChange}
        required
      >
        <option value="">Select a template</option>
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.displayName}
          </option>
        ))}
      </Select>

      <div className="actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update Repository' : 'Add Repository'}
        </Button>
      </div>
    </form>
  )
}
