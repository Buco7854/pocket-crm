import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, ChevronDown } from 'lucide-react'
import type { SupportedLocale } from '@/i18n'

const options: { value: SupportedLocale; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

export default function LocaleSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(locale: SupportedLocale) {
    i18n.changeLanguage(locale)
    localStorage.setItem('pocket-crm-locale', locale)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="cursor-pointer flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-all duration-200 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <Languages className="h-4 w-4" strokeWidth={2} />
        <span className="hidden sm:inline text-xs font-medium uppercase">{i18n.language}</span>
        <ChevronDown className="h-3 w-3 opacity-50" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-lg border border-surface-200 bg-surface-50 shadow-card-hover overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`cursor-pointer flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                i18n.language === opt.value
                  ? 'text-primary-500 bg-primary-500/10 font-medium'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              }`}
              onClick={() => select(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
