import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import Select from '@/components/ui/Select'

export interface FilterOption {
  key: string
  labelKey: string
  options: { value: string; label: string }[]
  multiple?: boolean
}

interface Props {
  searchQuery: string
  onSearchChange: (value: string) => void
  filters?: FilterOption[]
  filterValues?: Record<string, string | string[]>
  onFilterChange?: (key: string, value: string | string[]) => void
}

export default function SearchFilter({ searchQuery, onSearchChange, filters, filterValues, onFilterChange }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" strokeWidth={2} />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder={t('common.search')}
          className="w-full h-9 rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 pl-10 pr-4 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>
      {filters?.length && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {filters.map((filter) =>
            filter.multiple ? (
              <Select
                key={filter.key}
                multiple
                options={filter.options}
                values={Array.isArray(filterValues?.[filter.key]) ? (filterValues![filter.key] as string[]) : []}
                placeholder={t(filter.labelKey)}
                onChangeMultiple={(vs) => onFilterChange?.(filter.key, vs)}
                className="w-full sm:w-40"
              />
            ) : (
              <Select
                key={filter.key}
                options={filter.options}
                value={(filterValues?.[filter.key] as string) || ''}
                placeholder={t(filter.labelKey)}
                onChange={(v) => onFilterChange?.(filter.key, v)}
                className="w-full sm:w-40"
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
