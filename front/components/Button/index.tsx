import './Button.scss'

interface Props {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}: Props) { 
  return (
    <button
      type={type}
      className={`Button ${variant} ${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className="spinner">⏳</span> : children}
    </button>
  )
}
