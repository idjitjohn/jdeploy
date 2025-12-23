import './PageContent.scss'

interface Props {
  children: React.ReactNode
  className?: string
}

export default function PageContent({
  children,
  className = ''
}: Props) {
  return (
    <div className={`PageContent ${className}`}>
      {children}
    </div>
  )
}
