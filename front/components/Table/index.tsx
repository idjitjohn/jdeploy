import './Table.scss'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  striped?: boolean
  hoverable?: boolean
  className?: string
}

export default function Table<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  striped = true,
  hoverable = true,
  className = ''
}: Props<T>) {
  return (
    <div className={`Table ${className}`}>
      <table className={`content ${striped ? 'striped' : ''} ${hoverable ? 'hoverable' : ''}`}>
        <thead className="head">
          <tr className="row">
            {columns.map((column) => (
              <th key={String(column.key)} className="header">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="body">
          {data.length === 0 ? (
            <tr className="row">
              <td colSpan={columns.length} className="empty">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={String(row[keyField])} className="row">
                {columns.map((column) => (
                  <td key={String(column.key)} className="cell">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
