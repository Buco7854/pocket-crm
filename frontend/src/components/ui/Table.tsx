import { useTranslation } from 'react-i18next'
import { ChevronUp, Inbox } from 'lucide-react'

export interface TableColumn<T> {
  key: keyof T & string
  labelKey: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface Props<T extends Record<string, unknown>> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  rowKey?: keyof T & string
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
}

export default function Table<T extends Record<string, unknown>>({
  columns, data, loading = false, sortBy, sortDir = 'asc', rowKey = 'id' as keyof T & string, onSort, onRowClick,
}: Props<T>) {
  const { t } = useTranslation()

  function alignClass(align?: string) {
    return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-surface-200 bg-surface-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500 ${alignClass(col.align)} ${col.sortable ? 'cursor-pointer select-none hover:text-surface-700 transition-colors' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                    {t(col.labelKey)}
                    {col.sortable && sortBy === col.key && (
                      <ChevronUp className={`h-3.5 w-3.5 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3"><div className="skeleton h-4 w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-surface-400">
                    <Inbox className="h-10 w-10" strokeWidth={1.5} />
                    <p className="text-sm">{t('common.noResults')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={String(row[rowKey])}
                  className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-surface-700 ${alignClass(col.align)}`}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
