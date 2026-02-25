import { useState, useRef, useEffect, useMemo, useId } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface SelectOption { value: string; label: string }

interface Props {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  searchable?: boolean
  className?: string
  // Single-select
  multiple?: false
  value?: string
  onChange?: (value: string) => void
  // Multi-select (active when multiple=true; value/onChange are ignored)
  values?: never
  onChangeMultiple?: never
}

interface MultiProps {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  searchable?: boolean
  className?: string
  multiple: true
  values?: string[]
  onChangeMultiple?: (values: string[]) => void
  // unused in multi mode
  value?: never
  onChange?: never
}

type CombinedProps = Props | MultiProps

export default function Select({ label, options, placeholder, error, required, disabled, searchable, multiple, value, onChange, values, onChangeMultiple, className = '' }: CombinedProps) {
  const id = useId()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open, searchable])

  const filtered = useMemo(() => {
    if (!searchable || !query) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query, searchable])

  // Selection state
  const selectedOption = !multiple ? options.find((o) => o.value === value) : null
  const currentValues = multiple ? (values || []) : []
  const hasSelection = multiple ? currentValues.length > 0 : !!selectedOption

  // Trigger label
  const triggerLabel = multiple
    ? currentValues.length === 0
      ? (placeholder ?? '')
      : currentValues.length === 1
        ? (options.find((o) => o.value === currentValues[0])?.label ?? '')
        : t('common.nSelected', { count: currentValues.length })
    : (selectedOption?.label ?? (placeholder ?? ''))

  function toggle() {
    if (disabled) return
    setOpen((v) => !v)
    setQuery('')
  }

  function selectSingle(optValue: string) {
    onChange?.(optValue)
    setOpen(false)
    setQuery('')
  }

  function toggleMulti(optValue: string) {
    const next = currentValues.includes(optValue)
      ? currentValues.filter((v) => v !== optValue)
      : [...currentValues, optValue]
    onChangeMultiple?.(next)
    // keep dropdown open for multi
  }

  function isSelected(optValue: string) {
    return multiple ? currentValues.includes(optValue) : value === optValue
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-surface-700">
          {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative" ref={ref}>
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={toggle}
          className={`cursor-pointer w-full h-9 rounded-[var(--radius-input)] border text-sm text-left transition-all duration-200 focus:outline-none focus:ring-2 bg-surface-0 pl-3 pr-9 flex items-center ${
            error
              ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500'
              : open
              ? 'border-primary-500 ring-2 ring-primary-500/20'
              : 'border-surface-200 hover:border-surface-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={`truncate ${hasSelection ? 'text-surface-900' : 'text-surface-400'}`}>
            {triggerLabel}
          </span>
        </button>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />

        {open && (
          <div className="absolute left-0 top-full mt-1 w-full rounded-lg border border-surface-200 bg-surface-50 shadow-card-hover overflow-hidden z-50">
            {searchable && (
              <div className="px-2 py-2 border-b border-surface-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-400 pointer-events-none" strokeWidth={2} />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-7 rounded-md border border-surface-200 bg-surface-0 pl-7 pr-3 text-xs text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                    placeholder={t('common.search')}
                  />
                </div>
              </div>
            )}
            <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {/* Clear / deselect-all row */}
              {!required && placeholder && (
                <button
                  type="button"
                  onClick={() => {
                    if (multiple) {
                      onChangeMultiple?.([])
                    } else {
                      selectSingle('')
                    }
                  }}
                  className={`cursor-pointer flex w-full items-center px-3 py-2 text-sm transition-colors ${
                    !hasSelection ? 'text-primary-500 bg-primary-500/10 font-medium' : 'text-surface-400 hover:bg-surface-100'
                  }`}
                >
                  {placeholder}
                </button>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-surface-400 text-center">{t('common.noResults')}</div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => multiple ? toggleMulti(opt.value) : selectSingle(opt.value)}
                    className={`cursor-pointer flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                      isSelected(opt.value)
                        ? 'text-primary-500 bg-primary-500/10 font-medium'
                        : 'text-surface-700 hover:bg-surface-100 hover:text-surface-900'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected(opt.value) && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  )
}
