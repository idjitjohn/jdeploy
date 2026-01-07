import './Alert.scss'

type Type = 'success' | 'error' | 'warning' | 'info'

interface Props {
  children: React.ReactNode
  type?: Type
  title?: string
  onClose?: () => void
  className?: string
}

export default function Alert({
  children,
  type = 'info',
  title,
  onClose,
  className = ''
}: Props) {
  return (
    <div className={`Alert ${type} ${className}`}>
      {onClose && (
        <button className="close" onClick={onClose} aria-label="Close alert">
          ×
        </button>
      )}
      <div className="content">
        {title && <h4 className="title">{title}</h4>}
        <p className="message">{children}</p>
      </div>
    </div>
  )
}
