import React from 'react'
import './Card.scss'

interface Props {
  children: React.ReactNode
  title?: string
  subtitle?: string
  footer?: React.ReactNode
  onClick?: () => void
  className?: string
}

export default function Card({
  children,
  title,
  subtitle,
  footer,
  onClick,
  className = ''
}: Props) {
  return (
    <div className={`Card ${className}`} onClick={onClick}>
      {(title || subtitle) && (
        <div className="header">
          {title && <h3 className="title">{title}</h3>}
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
      )}

      <div className="body">
        {children}
      </div>

      {footer && (
        <div className="footer">
          {footer}
        </div>
      )}
    </div>
  )
}
