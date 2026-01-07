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

  const updateLineNumbers = () => {
    if (!lineNumbersRef.current || !textareaRef.current) return

    const textarea = textareaRef.current
    const container = lineNumbersRef.current
    const lines = value.split('\n')

    container.innerHTML = ''

    // Create a hidden div to measure line heights
    const measureDiv = document.createElement('div')
    measureDiv.style.cssText = window.getComputedStyle(textarea).cssText
    measureDiv.style.position = 'absolute'
    measureDiv.style.visibility = 'hidden'
    measureDiv.style.height = 'auto'
    measureDiv.style.width = `${textarea.clientWidth}px`
    measureDiv.style.whiteSpace = window.getComputedStyle(textarea).whiteSpace
    measureDiv.style.wordWrap = window.getComputedStyle(textarea).wordWrap
    measureDiv.style.overflowWrap = window.getComputedStyle(textarea).overflowWrap
    document.body.appendChild(measureDiv)

    // Get the base line height from computed style
    const computedStyle = window.getComputedStyle(textarea)
    const baseLineHeight = parseFloat(computedStyle.lineHeight)

    lines.forEach((line, i) => {
      // Measure the actual height of this line when rendered
      measureDiv.textContent = line || ' '
      const actualHeight = measureDiv.offsetHeight

      // Calculate how many visual lines this logical line takes
      const visualLineCount = Math.round(actualHeight / baseLineHeight)

      const lineDiv = document.createElement('div')
      lineDiv.className = 'line-number'
      lineDiv.textContent = String(i + 1)
      for (let i = 1; i < visualLineCount; i++) lineDiv.appendChild(document.createElement('br'))
      container.appendChild(lineDiv)
    })

    document.body.removeChild(measureDiv)
  }

  useEffect(() => {
    updateLineNumbers()
  }, [value])

  useEffect(() => {
    const handleResize = () => updateLineNumbers()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
      <div className='ce-container'>
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
    </div>
  )
}
