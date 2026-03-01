import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStats } from '@/hooks/useStats'
import type { Period } from './PeriodFilter'
import KpiCard from '@/components/dashboard/KpiCard'
import Skeleton from '@/components/dashboard/Skeleton'
import { Users, UserCheck, UserPlus, ShoppingBag } from 'lucide-react'
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from './chartUtils'

interface ClientData {
  total_clients: number
  new_clients: number
  active_clients: number
  by_city: { city: string; count: number }[]
  by_industry: { industry: string; count: number }[]
  avg_basket: string
  top_clients: { contact_id: string; name: string; ltv: number }[]
}

const COLORS = [
  'var(--color-primary-500)', '#6366f1', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#84cc16', '#f97316',
]

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`
  return `${n}€`
}

interface Props {
  period: Period
}

export default function ClientStats({ period }: Props) {
  const { t } = useTranslation()
  const { data, loading } = useStats<ClientData>('clients', period)

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={t('stats.clients.total')}
          value={data ? data.total_clients : '—'}
          icon={<Users />}
          color="blue"
          loading={loading}
        />
        <KpiCard
          label={t('stats.clients.new')}
          value={data ? data.new_clients : '—'}
          icon={<UserPlus />}
          color="green"
          loading={loading}
        />
        <KpiCard
          label={t('stats.clients.active')}
          value={data ? data.active_clients : '—'}
          icon={<UserCheck />}
          color="purple"
          loading={loading}
        />
        <KpiCard
          label={t('stats.clients.avgBasket')}
          value={data ? fmtMoney(Number(data.avg_basket)) : '—'}
          icon={<ShoppingBag />}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Segmentation pies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By city */}
        <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.clients.segmentation')} — {t('fields.city')}</h3>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : data && data.by_city.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={data.by_city}
                      dataKey="count"
                      nameKey="city"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                    >
                      {data.by_city.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5 w-full min-w-0">
                {data.by_city.map((c, i) => (
                  <li key={c.city} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-surface-700 flex-1 truncate">{c.city}</span>
                    <span className="text-sm font-semibold text-surface-900 tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-surface-400">{t('common.noResults')}</p>
            </div>
          )}
        </div>

        {/* By industry */}
        <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.clients.segmentation')} — {t('fields.industry')}</h3>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : data && data.by_industry.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={data.by_industry}
                      dataKey="count"
                      nameKey="industry"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                    >
                      {data.by_industry.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5 w-full min-w-0">
                {data.by_industry.map((ind, i) => (
                  <li key={ind.industry} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-surface-700 flex-1 truncate">{ind.industry}</span>
                    <span className="text-sm font-semibold text-surface-900 tabular-nums">{ind.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-surface-400">{t('common.noResults')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Top clients */}
      <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
        <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.clients.topClients')}</h3>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : data && data.top_clients.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-surface-400 border-b border-surface-100">
                <th className="pb-2 font-medium w-8">#</th>
                <th className="pb-2 font-medium">{t('fields.name')}</th>
                <th className="pb-2 font-medium text-right">{t('stats.clients.ltv')}</th>
              </tr>
            </thead>
            <tbody>
              {data.top_clients.map((c, i) => (
                <tr key={c.contact_id} className="border-b border-surface-50 last:border-0">
                  <td className="py-2 text-xs text-surface-400 tabular-nums">{i + 1}</td>
                  <td className="py-2 text-surface-800 font-medium">{c.name}</td>
                  <td className="py-2 text-right tabular-nums text-surface-700">{fmtMoney(c.ltv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-surface-400">{t('common.noResults')}</p>
        )}
      </div>
    </div>
  )
}
