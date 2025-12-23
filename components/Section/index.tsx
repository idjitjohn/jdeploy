import './Section.scss'

interface Props {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
}

export default function Section({
  children,
  title,
  subtitle,
  className = ''
}: Props) {
  return (
    <section className={`Section ${className}`}>
      {(title || subtitle) && (
        <div className="header">
          {title && <h2 className="title">{title}</h2>}
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="content">
        {children}
      </div>
    </section>
  )
}
