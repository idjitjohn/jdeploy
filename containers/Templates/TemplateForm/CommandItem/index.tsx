'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './CommandItem.scss'

const VARIABLES = [
  { key: '$branch$', description: 'Current branch' },
  { key: '$cf$', description: 'Code folder' },
  { key: '$rf$', description: 'Release folder' },
  { key: '$repoName$', description: 'Repository name' },
  { key: '$domain$', description: 'Domain name' },
  { key: '$port$', description: 'Port number' },
]

interface Props {
  id: string
  command: string
  index: number
  onUpdate: (newCommand: string) => void
  onDelete: () => void
  onDeleteLine?: () => void
  onFocusPrevious?: () => void
  onAddAfter?: () => void
  autoEdit?: boolean
  inputRef?: (el: HTMLInputElement | null) => void
  itemRef?: (el: CommandItemHandle) => void
}

export interface CommandItemHandle {
  flushPendingEdit: () => void
}

export default function CommandItem({ id, command, index, onUpdate, onDelete, onDeleteLine, onFocusPrevious, onAddAfter, autoEdit, inputRef: inputRefCallback, itemRef }: Props) {
  const [isEditing, setIsEditing] = useState(autoEdit || false)
  const [editValue, setEditValue] = useState(command)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompletePos, setAutocompletePos] = useState({ top: 0, left: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Position caret at the end of the input instead of selecting all
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  const handleBlur = () => {
    // Clear any pending timeout first
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
    }

    // Use timeout only to allow clicking on autocomplete items, but update state immediately
    if (editValue.trim() && editValue !== command) {
      console.log('Command updated:', { old: command, new: editValue.trim() })
      onUpdate(editValue.trim())
    } else {
      setEditValue(command)
    }
    
    // Delay hiding the input to allow autocomplete interaction
    blurTimeoutRef.current = setTimeout(() => {
      setIsEditing(false)
    }, 150)
  }

  const flushPendingEdit = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (editValue.trim() && editValue !== command) {
      console.log('Flushing pending edit:', { old: command, new: editValue.trim() })
      onUpdate(editValue.trim())
    }
    setIsEditing(false)
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Position caret at the end of the input instead of selecting all
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  useEffect(() => {
    // Expose the input ref to the parent
    if (inputRefCallback && !isEditing) {
      inputRefCallback(null)
    }
  }, [isEditing, inputRefCallback])

  useEffect(() => {
    // Expose the item ref for flush operations
    if (itemRef) {
      itemRef({ flushPendingEdit })
    }
  }, [itemRef, flushPendingEdit])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  const calculateAutocompletePos = () => {
    if (!inputRef.current) return
    const input = inputRef.current
    const cursorPos = input.selectionStart || 0
    const textBeforeCursor = input.value.substring(0, cursorPos)

    // Calculate approximate position
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) {
      context.font = window.getComputedStyle(input).font
      const textWidth = context.measureText(textBeforeCursor).width
      setAutocompletePos({
        left: textWidth,
        top: 24
      })
    }
  }

  const handleInputChange = (value: string) => {
    setEditValue(value)

    // Check if we should show autocomplete
    const cursorPos = inputRef.current?.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPos)

    if (textBeforeCursor.includes('$$')) {
      calculateAutocompletePos()
      setShowAutocomplete(true)
    } else {
      setShowAutocomplete(false)
    }
  }

  const handleSelectVariable = (variable: string) => {
    // Clear the blur timeout to prevent closing the input
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }

    const cursorPos = inputRef.current?.selectionStart || 0
    const textBeforeCursor = editValue.substring(0, cursorPos)
    const textAfterCursor = editValue.substring(cursorPos)

    // Find the $$ and replace it with the variable
    const lastDollarPos = textBeforeCursor.lastIndexOf('$$')
    if (lastDollarPos !== -1) {
      const newValue = textBeforeCursor.substring(0, lastDollarPos) + variable + textAfterCursor
      setEditValue(newValue)
      setShowAutocomplete(false)

      // Focus back to input and position cursor after the variable
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = lastDollarPos + variable.length
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showAutocomplete) {
      e.preventDefault()
      if (editValue.trim() && editValue !== command) {
        onUpdate(editValue.trim())
      } else if (!editValue.trim()) {
        setEditValue(command)
      }
      setIsEditing(false)
      if (onAddAfter) {
        setTimeout(() => onAddAfter(), 0)
      }
    } else if (e.key === 'Escape') {
      if (showAutocomplete) {
        setShowAutocomplete(false)
      } else {
        setEditValue(command)
        setIsEditing(false)
      }
    } else if (e.key === 'Backspace' && editValue === '' && index > 0) {
      // Mark that user started backspace on empty input
      // We'll complete the delete action on keyup
      e.preventDefault()
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && editValue === '' && index > 0) {
      // Only delete if input is still empty after backspace
      if (onDeleteLine) {
        onDeleteLine()
        // Focus previous line
        if (onFocusPrevious) {
          setTimeout(() => onFocusPrevious(), 0)
        }
      }
    }
  }

  const handleCodeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`CommandItem ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <div ref={containerRef} className="ci-input-wrapper">
          <input
            ref={(el) => {
              // Attach to internal ref
              inputRef.current = el
              // Also expose to parent via callback prop
              if (inputRefCallback) {
                inputRefCallback(el)
              }
            }}
            type="text"
            className="ci-input"
            value={editValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              e.stopPropagation()
              handleKeyDown(e)
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => {
              e.stopPropagation()
              handleKeyUp(e)
              calculateAutocompletePos()
            }}
            onKeyPress={(e) => e.stopPropagation()}
          />
          {showAutocomplete && (
            <div className="ci-autocomplete" style={{ top: `${autocompletePos.top}px`, left: `${autocompletePos.left}px` }}>
              {VARIABLES.map((variable) => (
                <div
                  key={variable.key}
                  className="ci-autocomplete-item"
                  onClick={() => handleSelectVariable(variable.key)}
                >
                  <span className="key">{variable.key}</span>
                  <span className="description">{variable.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <code
          className="ci-text"
          onClick={handleCodeClick}
          data-no-dnd="true"
        >
          {command}
        </code>
      )}

      <div className="ci-actions">
        <button
          className="ci-delete"
          onClick={onDelete}
          aria-label="Delete command"
          type="button"
        />
      </div>
    </div>
  )
}
