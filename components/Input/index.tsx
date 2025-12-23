import './Input.scss'

interface Props {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  error?: string
  label?: string
  name?: string
  className?: string
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  label,
  name,
  className = ''
}: Props) {
  return (
    <div className={`Input ${className}`}>
      {label && <label className="label">{label}</label>}
      <input
        type={type}
        className={`field ${error ? 'error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        name={name}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}
