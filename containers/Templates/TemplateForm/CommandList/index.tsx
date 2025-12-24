'use client'

import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import CommandItem, { CommandItemHandle } from '../CommandItem'
import Button from '@/components/Button'
import './CommandList.scss'

interface Props {
  commands: string[]
  onCommandsChange: (commands: string[]) => void
  onAddCommand: (afterIndex?: number) => void
  onDeleteCommand: (index: number) => void
  listRef?: (handle: CommandListHandle) => void
}

export interface CommandListHandle {
  flushAllEdits: () => void
}

export default function CommandList({
  commands,
  onCommandsChange,
  onAddCommand,
  onDeleteCommand,
  listRef
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const commandRefs = useRef<(HTMLInputElement | null)[]>([])
  const itemRefs = useRef<(CommandItemHandle | null)[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5,
        button: 0
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.hasAttribute('data-no-dnd')) {
      e.preventDefault()
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = commands.indexOf(active.id as string)
      const newIndex = commands.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCommands = arrayMove(commands, oldIndex, newIndex)
        console.log('Commands reordered:', newCommands)
        onCommandsChange(newCommands)
      }
    }
  }

  const handleAddCommandClick = () => {
    const newIndex = commands.length
    onAddCommand()
    setEditingIndex(newIndex)
  }

  const handleAddAfter = (afterIndex: number) => {
    onAddCommand(afterIndex)
    setEditingIndex(afterIndex + 1)
  }

  const handleDeleteLine = (index: number) => {
    onDeleteCommand(index)
  }

  const handleFocusPrevious = (currentIndex: number) => {
    if (currentIndex > 0) {
      const prevInput = commandRefs.current[currentIndex - 1]
      if (prevInput) {
        prevInput.focus()
        // Position caret at the end of the line
        const length = prevInput.value.length
        prevInput.setSelectionRange(length, length)
      }
    }
  }

  const flushAllEdits = () => {
    itemRefs.current.forEach((handle) => {
      if (handle) {
        handle.flushPendingEdit()
      }
    })
  }

  useEffect(() => {
    if (listRef) {
      listRef({ flushAllEdits })
    }
  }, [listRef, flushAllEdits])

  return (
    <div className="CommandList">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={commands}
          strategy={verticalListSortingStrategy}
        >
          <div className="commands-list" onPointerDown={handlePointerDown}>
            {commands.map((command, index) => (
              <CommandItem
                key={command + index}
                id={command}
                command={command}
                index={index}
                autoEdit={editingIndex === index}
                onUpdate={(newCommand) => {
                  const newCommands = [...commands]
                  newCommands[index] = newCommand
                  onCommandsChange(newCommands)
                  setEditingIndex(null)
                }}
                onDelete={() => onDeleteCommand(index)}
                onAddAfter={() => handleAddAfter(index)}
                onDeleteLine={() => handleDeleteLine(index)}
                onFocusPrevious={() => handleFocusPrevious(index)}
                inputRef={(el) => {
                  commandRefs.current[index] = el
                }}
                itemRef={(handle) => {
                  itemRefs.current[index] = handle
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="command-actions">
        <Button size='sm' onClick={handleAddCommandClick}>+ Add Command</Button>
      </div>
    </div>
  )
}
