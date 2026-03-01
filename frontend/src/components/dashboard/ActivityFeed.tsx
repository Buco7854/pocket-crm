import { useTranslation } from 'react-i18next'
import {
  PlusCircle, Edit2, Mail, Phone, MessageSquare, RefreshCw, Zap,
} from 'lucide-react'
import type { RecentActivity } from '@/hooks/useDashboard'
import Skeleton from './Skeleton'

function typeIcon(type: string) {
  switch (type) {
    case 'creation':      return <PlusCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
    case 'modification':  return <Edit2 className="h-3.5 w-3.5" strokeWidth={1.75} />
    case 'email':         return <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
    case 'appel':         return <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
    case 'note':          return <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
    case 'statut_change': return <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
    default:              return <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
  }
}

function typeColor(type: string) {
  switch (type) {
    case 'creation':      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    case 'email':         return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    case 'appel':         return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
    case 'statut_change': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    default:              return 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
  }
}

function relativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `il y a ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `il y a ${h}h`
    const day = Math.floor(h / 24)
    if (day < 7) return `il y a ${day}j`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

interface Props {
  activities: RecentActivity[]
  loading: boolean
}

export default function ActivityFeed({ activities, loading }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
      <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.recentActivities')}</h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-surface-400">{t('stats.noActivities')}</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${typeColor(a.type)}`}>
                {typeIcon(a.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-surface-700 leading-snug truncate">{a.description}</p>
                <p className="text-xs text-surface-400 mt-0.5">
                  {a.user_name && <span className="font-medium text-surface-500">{a.user_name} · </span>}
                  {relativeTime(a.created)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
