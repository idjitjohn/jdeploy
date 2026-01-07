import { useEffect } from 'react'

interface UseModalProps {
  isOpen: boolean
  size?: 'small' | 'medium' | 'large'
}

export function useModal({ isOpen, size = 'medium' }: UseModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const getMaxWidth = () => {
    if (size === 'small') return '24em'
    if (size === 'large') return '48em'
    return '36em'
  }

  return {
    maxWidth: getMaxWidth(),
    isOpen
  }
}
