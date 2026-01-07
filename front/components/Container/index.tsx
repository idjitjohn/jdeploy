import './Container.scss'

interface Props {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Container({
  children,
  size = 'lg',
  className = ''
}: Props) {
  return (
    <div className={`Container ${size} ${className}`}>
      {children}
    </div>
  )
}
