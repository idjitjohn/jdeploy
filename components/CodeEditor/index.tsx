'use client'

import { useRef, useEffect } from 'react'
import './CodeEditor.scss'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  language?: string
}

export default function CodeEditor({
  value = '',
  onChange,
  placeholder = '',
  rows = 12,
  language = 'nginx'
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const getLineIndentation = (lineText: string): string => {
    const match = lineText.match(/^(\s*)/)
    return match ? match[1] : ''
  }

  useEffect(() => {
    if (!lineNumbersRef.current) return
    alert(JSON.stringify(value))
    const lineCount = value.split('\n').length
    const container = lineNumbersRef.current

    container.innerHTML = ''

    for (let i = 1; i <= lineCount; i++) {
      const lineDiv = document.createElement('div')
      lineDiv.className = 'line-number'
      lineDiv.textContent = String(i)
      container.appendChild(lineDiv)
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd, value: text } = textarea

    // Handle Tab key - insert 2 spaces
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()

      const beforeCursor = text.substring(0, selectionStart)
      const afterCursor = text.substring(selectionEnd)
      const indent = '  '

      const newText = beforeCursor + indent + afterCursor
      onChange(newText)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length
      }, 0)
    }
    // Handle Shift+Tab - remove 2 spaces before cursor
    else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()

      const beforeCursor = text.substring(0, selectionStart)

      // Check if the 2 characters before cursor are spaces
      if (beforeCursor.endsWith('  ')) {
        const afterCursor = text.substring(selectionEnd)
        const newText = beforeCursor.slice(0, -2) + afterCursor
        onChange(newText)

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart - 2
        }, 0)
      }
    }
    // Handle Enter key with auto-indent
    else if (e.key === 'Enter') {
      e.preventDefault()

      const beforeCursor = text.substring(0, selectionStart)
      const afterCursor = text.substring(selectionEnd)
      const lines = beforeCursor.split('\n')
      const currentLine = lines[lines.length - 1]
      const indentation = getLineIndentation(currentLine)

      const newText = beforeCursor + '\n' + indentation + afterCursor
      onChange(newText)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indentation.length
      }, 0)
    }
    // Handle auto-close for quotes and brackets
    else if ((e.key === '"' || e.key === "'" || e.key === '{' || e.key === '(') && selectionStart === selectionEnd) {
      e.preventDefault()

      const beforeCursor = text.substring(0, selectionStart)
      const afterCursor = text.substring(selectionEnd)

      let closingChar = ''
      if (e.key === '"') closingChar = '"'
      else if (e.key === "'") closingChar = "'"
      else if (e.key === '{') closingChar = '}'
      else if (e.key === '(') closingChar = ')'

      const newText = beforeCursor + e.key + closingChar + afterCursor
      onChange(newText)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
      }, 0)
    }
  }

  return (
    <div className="CodeEditor">
      <div className="line-numbers" ref={lineNumbersRef}></div>
      <textarea
        ref={textareaRef}
        className="code-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck="false"
      />
    </div>
  )
}
