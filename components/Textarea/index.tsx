import './Textarea.scss'

interface Props {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  error?: string
  label?: string
  name?: string
  rows?: number
  className?: string
}

export default function Textarea({
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  name,
  rows = 4,
  className = ''
}: Props) {
  return (
    <div className={`Textarea ${className}`}>
      {label && <label className="label">{label}</label>}
      <textarea
        className={`field ${error ? 'error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        name={name}
        rows={rows}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}
