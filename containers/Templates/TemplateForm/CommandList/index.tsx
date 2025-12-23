'use client'

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
import CommandItem from '../CommandItem'
import Button from '@/components/Button'
import './CommandList.scss'

interface Props {
  commands: string[]
  onCommandsChange: (commands: string[]) => void
  onEditCommand: (index: number, command: string) => void
  onAddCommand: () => void
  onDeleteCommand: (index: number) => void
}

export default function CommandList({
  commands,
  onCommandsChange,
  onEditCommand,
  onAddCommand,
  onDeleteCommand
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = commands.indexOf(active.id as string)
      const newIndex = commands.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCommands = arrayMove(commands, oldIndex, newIndex)
        onCommandsChange(newCommands)
      }
    }
  }

  return (
    <div className="CommandList">
      {commands.length === 0 ? (
        <div className="empty-state">
          <p>No commands added yet</p>
          <Button onClick={onAddCommand}>Add Command</Button>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={commands}
              strategy={verticalListSortingStrategy}
            >
              <div className="commands-list">
                {commands.map((command, index) => (
                  <CommandItem
                    key={command + index}
                    id={command}
                    command={command}
                    index={index}
                    onEdit={() => onEditCommand(index, command)}
                    onDelete={() => onDeleteCommand(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="command-actions">
            <Button size='sm' onClick={onAddCommand}>+ Add Command</Button>
          </div>
        </>
      )}
    </div>
  )
}
