import './PageHeader.scss'

interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  className = ''
}: Props) {
  return (
    <div className={`PageHeader ${className}`}>
      <div className="content">
        <div className="info">
          <h1 className="title">{title}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  )
}
