import './Spinner.scss'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  size?: Size
  className?: string
}

export default function Spinner({
  size = 'md',
  className = ''
}: Props) {
  return (
    <div className={`Spinner ${size} ${className}`} role="status" aria-label="Loading">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  )
}
