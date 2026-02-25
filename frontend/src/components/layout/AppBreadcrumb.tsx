import { useMatches, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  labelKey: string
  to?: string
}

export default function AppBreadcrumb({ className }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const matches = useMatches()

  const crumbs: Crumb[] = matches
    .filter((m) => (m.handle as { breadcrumb?: Crumb[] } | undefined)?.breadcrumb)
    .flatMap((m) => (m.handle as { breadcrumb: Crumb[] }).breadcrumb)

  if (!crumbs.length) return null

  return (
    <nav className={`flex items-center gap-1.5 text-sm ${className ?? ''}`}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-4 w-4 text-surface-300" strokeWidth={2} />}
          {crumb.to && i < crumbs.length - 1 ? (
            <button
              className="cursor-pointer text-surface-500 hover:text-primary-600 transition-colors"
              onClick={() => navigate(crumb.to!)}
            >
              {t(crumb.labelKey)}
            </button>
          ) : (
            <span className="font-medium text-surface-900">{t(crumb.labelKey)}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
