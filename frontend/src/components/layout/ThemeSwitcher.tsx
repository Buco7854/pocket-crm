import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'

const options: { value: ThemeMode; icon: React.ElementType }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const CurrentIcon = options.find((o) => o.value === theme)?.icon ?? Monitor

  return (
    <div className="relative" ref={ref}>
      <button
        className="cursor-pointer flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-all duration-200 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <CurrentIcon className="h-4 w-4" strokeWidth={2} />
        <span className="hidden sm:inline text-xs font-medium">{t(`theme.${theme}`)}</span>
        <ChevronDown className="h-3 w-3 opacity-50" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-lg border border-surface-200 bg-surface-50 shadow-card-hover overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`cursor-pointer flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                theme === opt.value
                  ? 'text-primary-500 bg-primary-500/10 font-medium'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              }`}
              onClick={() => { setTheme(opt.value); setOpen(false) }}
            >
              <opt.icon className="h-4 w-4" strokeWidth={2} />
              {t(`theme.${opt.value}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
