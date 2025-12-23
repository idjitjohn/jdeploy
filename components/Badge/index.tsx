import './Badge.scss'

type Variant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  children: React.ReactNode
  variant?: Variant
  size?: Size
  className?: string
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}: Props) {
  return (
    <span className={`Badge ${variant} ${size} ${className}`}>
      {children}
    </span>
  )
}
