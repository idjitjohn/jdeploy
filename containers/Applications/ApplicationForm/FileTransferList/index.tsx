'use client'

import Button from '@/components/Button'
import './FileTransferList.scss'

type FileOperation = 'cp' | 'mv' | 'ln'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface Props {
  items: FileTransfer[]
  onChange: (items: FileTransfer[]) => void
  defaultDest?: string
  defaultSrc?: string
}

const OPERATIONS: FileOperation[] = ['cp', 'mv', 'ln']

export default function FileTransferList({ items, onChange, defaultDest = '$rf$', defaultSrc = '$cf$' }: Props) {
  const handleAdd = () => {
    onChange([...items, { src: defaultSrc, dest: defaultDest, op: 'cp' }])
  }

  const handleUpdate = (index: number, field: 'src' | 'dest', value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }

  const handleToggleOp = (index: number) => {
    const newItems = [...items]
    const currentOp = newItems[index].op || 'cp'
    const currentIndex = OPERATIONS.indexOf(currentOp)
    const nextIndex = (currentIndex + 1) % OPERATIONS.length
    newItems[index] = { ...newItems[index], op: OPERATIONS[nextIndex] }
    onChange(newItems)
  }

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="FileTransferList">
      <div className="items">
        {items.map((item, index) => (
          <div key={index} className="item">
            <div className="item-actions">
              <button
                type="button"
                className="delete-btn"
                onClick={() => handleDelete(index)}
                aria-label="Delete"
              />
            </div>
            <input
              type="text"
              className="src-input"
              placeholder="Source path..."
              value={item.src}
              onChange={(e) => handleUpdate(index, 'src', e.target.value)}
            />
            <button
              type="button"
              className={`mode-toggle ${item.op || 'cp'}`}
              onClick={() => handleToggleOp(index)}
              title={item.op === 'cp' ? 'Copy file' : item.op === 'mv' ? 'Move file' : 'Symlink'}
            >
              {item.op || 'cp'}
            </button>
            <input
              type="text"
              className="dest-input"
              placeholder="Destination path..."
              value={item.dest}
              onChange={(e) => handleUpdate(index, 'dest', e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="list-actions">
        <Button type="button" size="sm" onClick={handleAdd}>+ Add File</Button>
      </div>
    </div>
  )
}
