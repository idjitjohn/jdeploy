import './StatCard.scss'

interface Props {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  className = ''
}: Props) {
  return (
    <div className={`StatCard ${className}`}>
      {icon && <div className="icon">{icon}</div>}
      <div className="content">
        <p className="label">{label}</p>
        <h3 className="value">{value}</h3>
        {trendValue && (
          <span className={`trend ${trend || 'neutral'}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  )
}
