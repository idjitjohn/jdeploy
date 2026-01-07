'use client'

import { ReactNode } from 'react'
import { useModal } from './useModal'
import './Modal.scss'

interface Props {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
}

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  size = 'medium'
}: Props) {
  const { maxWidth } = useModal({ isOpen, size })

  if (!isOpen) return null

  return (
    <div className="Modal active">
      <div className="md-overlay" onClick={onClose} />
      <div className="md-content" style={{ maxWidth }}>
        <div className="md-header">
          <h3 className="md-title">{title}</h3>
          <button
            className="md-close"
            onClick={onClose}
            type="button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="md-body">
          {children}
        </div>
      </div>
    </div>
  )
}
