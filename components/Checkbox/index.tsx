import './Checkbox.scss'

interface Props {
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  label?: string
  name?: string
  className?: string
}

export default function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  name,
  className = ''
}: Props) {
  return (
    <label className={`Checkbox ${className}`}>
      <input
        type="checkbox"
        className="input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
      />
      <span className="mark"></span>
      {label && <span className="label">{label}</span>}
    </label>
  )
}
