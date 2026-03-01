import { useTranslation } from 'react-i18next'
import type { PipelineStage } from '@/hooks/useDashboard'
import Skeleton from './Skeleton'

const STAGE_ORDER = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation']
const STAGE_COLORS: Record<string, string> = {
  nouveau:     'bg-slate-400',
  contacte:    'bg-blue-400',
  qualifie:    'bg-indigo-500',
  proposition: 'bg-violet-500',
  negociation: 'bg-purple-600',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

interface Props {
  stages: PipelineStage[]
  loading: boolean
}

export default function PipelineWidget({ stages, loading }: Props) {
  const { t } = useTranslation()

  const ordered = STAGE_ORDER.map((s) => stages.find((r) => r.stage === s)).filter(Boolean) as PipelineStage[]
  const maxAmount = Math.max(...ordered.map((s) => s.amount), 1)

  return (
    <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
      <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.pipeline.title')}</h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <p className="text-sm text-surface-400">{t('empty.leads')}</p>
      ) : (
        <ul className="space-y-3">
          {ordered.map((s) => (
            <li key={s.stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-surface-600">{t(`status.${s.stage}`)}</span>
                <span className="text-xs text-surface-500 tabular-nums">
                  {s.count} · {fmt(s.amount)}€
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-100">
                <div
                  className={`h-full rounded-full transition-all ${STAGE_COLORS[s.stage] ?? 'bg-primary-500'}`}
                  style={{ width: `${(s.amount / maxAmount) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
