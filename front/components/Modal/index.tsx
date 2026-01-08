'use client'

import { ReactNode } from 'react'
import { createRoot, Root } from 'react-dom/client'
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

// Static modal management
interface ModalData {
  id: number
  title: string
  content: ReactNode
  hiding?: boolean
}

let container: HTMLDivElement | null = null
let root: Root | null = null
let modals: ModalData[] = []
let idCounter = 0

function StaticModalItem({ id, title, content, hiding }: ModalData) {
  const handleClose = () => {
    closeModal(id)
  }

  return (
    <div className={`Modal active${hiding ? ' hiding' : ''}`}>
      <div className="md-overlay" onClick={handleClose} />
      <div className="md-content">
        <div className="md-header">
          <h3 className="md-title">{title}</h3>
          <button className="md-close" onClick={handleClose}>×</button>
        </div>
        <div className="md-body">
          {content}
        </div>
      </div>
    </div>
  )
}

function StaticModalContainer() {
  return (
    <>
      {modals.map((m) => (
        <StaticModalItem key={m.id} {...m} />
      ))}
    </>
  )
}

function render() {
  if (!container) {
    container = document.createElement('div')
    container.id = 'static-modal-container'
    document.body.appendChild(container)
    root = createRoot(container)
  }
  root?.render(<StaticModalContainer />)
}

function closeModal(id: number) {
  const idx = modals.findIndex(m => m.id === id)
  if (idx !== -1) {
    modals[idx].hiding = true
    render()
    setTimeout(() => {
      modals = modals.filter(m => m.id !== id)
      render()
    }, 200)
  }
}

export function createModal(title: string, content: ReactNode): number {
  const id = ++idCounter
  modals.push({ id, title, content })
  render()
  return id
}

export function destroyModal(id: number): void {
  closeModal(id)
}
