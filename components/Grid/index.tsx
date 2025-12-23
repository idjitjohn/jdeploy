import './Grid.scss'

interface Props {
  children: React.ReactNode
  columns?: number
  gap?: string
  className?: string
}

export default function Grid({
  children,
  columns = 3,
  gap = '1.5em',
  className = ''
}: Props) {
  return (
    <div 
      className={`Grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      }}
    >
      {children}
    </div>
  )
}
