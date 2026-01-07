import { ReactNode } from 'react'
import './Select.scss'

interface Option {
  value: string | number
  label: string
}

interface Props {
  options?: Option[]
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  required?: boolean
  error?: string
  label?: string
  name?: string
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode
}

export default function Select({
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  label,
  name,
  placeholder = 'Select an option',
  className = '',
  size = 'md',
  children
}: Props) {
  return (
    <div className={`Select ${className} ${size}`}>
      {label && <label className="label">{label}</label>}
      <select
        className={`field ${error ? 'error' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        name={name}
      >
        {children ? (
          children
        ) : (
          <>
            <option value="">{placeholder}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}
