import { useTranslation } from 'react-i18next'
import { useStats } from '@/hooks/useStats'
import type { Period } from './PeriodFilter'
import Skeleton from '@/components/dashboard/Skeleton'
import { Medal, Phone, Mail, CalendarDays, Trophy } from 'lucide-react'

interface LeaderEntry {
  user_id: string
  name: string
  won: number
  revenue: number
  total_leads: number
  success_rate: string
  calls: number
  emails: number
  meetings: number
  total_tasks: number
}

interface CommercialData {
  leaderboard: LeaderEntry[]
}

function fmtRevenue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`
  return `${n}€`
}

const RANK_COLORS = ['text-yellow-500', 'text-slate-400', 'text-orange-400']

interface Props {
  period: Period
}

export default function CommercialLeaderboard({ period }: Props) {
  const { t } = useTranslation()
  const { data, loading } = useStats<CommercialData>('commercials', period)

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-200 p-4 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  const leaders = data?.leaderboard ?? []

  if (leaders.length === 0) {
    return (
      <div className="rounded-xl bg-surface-0 border border-surface-200 p-8 flex items-center justify-center">
        <p className="text-sm text-surface-400">{t('common.noResults')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Podium — top 3 */}
      {leaders.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {leaders.slice(0, 3).map((l, i) => (
            <div
              key={l.user_id}
              className={`rounded-xl bg-surface-0 border p-4 text-center ${
                i === 0 ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-surface-200'
              }`}
            >
              <div className={`text-2xl mb-1 ${RANK_COLORS[i] ?? 'text-surface-400'}`}>
                {i === 0 ? <Trophy className="h-6 w-6 mx-auto" strokeWidth={1.75} /> : <Medal className="h-5 w-5 mx-auto" strokeWidth={1.75} />}
              </div>
              <p className="text-sm font-semibold text-surface-900 truncate">{l.name}</p>
              <p className="text-xs text-surface-500 mt-0.5">{t('stats.commercials.wins')}: {l.won}</p>
              <p className="text-base font-bold text-primary-600 mt-1 tabular-nums">{fmtRevenue(l.revenue)}</p>
              <p className="text-xs text-surface-400 mt-0.5">{t('stats.commercials.successRate')}: {l.success_rate}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div className="rounded-xl bg-surface-0 border border-surface-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-left text-xs text-surface-400 border-b border-surface-200">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">{t('fields.name')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('stats.commercials.wins')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('stats.kpi.revenue')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('stats.commercials.successRate')}</th>
                <th className="px-4 py-3 font-medium text-right">
                  <Phone className="h-3.5 w-3.5 inline" />
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  <Mail className="h-3.5 w-3.5 inline" />
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  <CalendarDays className="h-3.5 w-3.5 inline" />
                </th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((l, i) => (
                <tr key={l.user_id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-surface-400 tabular-nums font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-surface-900">{l.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-surface-700">{l.won}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-surface-700 font-medium">{fmtRevenue(l.revenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={`text-xs font-medium ${Number(l.success_rate) >= 50 ? 'text-green-600' : 'text-surface-500'}`}>
                      {l.success_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-surface-600">{l.calls}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-surface-600">{l.emails}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-surface-600">{l.meetings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
