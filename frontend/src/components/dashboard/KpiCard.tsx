import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Skeleton from './Skeleton'

const colorMap = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',   icon: 'text-blue-600 dark:text-blue-400' },
  green:  { bg: 'bg-green-100 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-400' },
  red:    { bg: 'bg-red-100 dark:bg-red-900/30',     icon: 'text-red-600 dark:text-red-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400' },
}

interface Props {
  label: string
  value: string | number
  icon: ReactNode
  evolution?: number
  evolutionLabel?: string
  color?: keyof typeof colorMap
  loading?: boolean
}

export default function KpiCard({
  label, value, icon,
  evolution, evolutionLabel,
  color = 'blue', loading = false,
}: Props) {
  const colors = colorMap[color]

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-0 border border-surface-200 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  }

  const evo = evolution !== undefined ? Number(evolution) : undefined
  const evoPositive = evo !== undefined && evo > 0
  const evoNegative = evo !== undefined && evo < 0
  const evoNeutral  = evo !== undefined && evo === 0

  return (
    <div className="rounded-xl bg-surface-0 border border-surface-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-surface-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
          <span className={`[&>svg]:h-4.5 [&>svg]:w-4.5 ${colors.icon}`}>{icon}</span>
        </div>
      </div>

      <div className="text-2xl font-semibold text-surface-900 tabular-nums">
        {value}
      </div>

      {evo !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          evoPositive ? 'text-green-600' : evoNegative ? 'text-red-500' : 'text-surface-400'
        }`}>
          {evoPositive && <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />}
          {evoNegative && <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />}
          {evoNeutral  && <Minus className="h-3.5 w-3.5" strokeWidth={2} />}
          <span>
            {evoPositive ? '+' : ''}{evo.toFixed(1)}%
            {evolutionLabel && <span className="text-surface-400 font-normal"> {evolutionLabel}</span>}
          </span>
        </div>
      )}
    </div>
  )
}
