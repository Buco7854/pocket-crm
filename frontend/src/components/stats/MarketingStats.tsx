import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStats } from '@/hooks/useStats'
import type { Period } from './PeriodFilter'
import KpiCard from '@/components/dashboard/KpiCard'
import RevenueChart from './RevenueChart'
import Skeleton from '@/components/dashboard/Skeleton'
import { Target, Mail, MousePointerClick, Megaphone, TrendingUp, Euro } from 'lucide-react'
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from './chartUtils'

interface EmailStats {
  total: number
  sent: number
  open_rate: string
  click_rate: string
}

interface MarketingData {
  leads_by_month: { month: string; count: number }[]
  by_source: { source: string; count: number }[]
  total_leads: number
  email_stats: EmailStats
  cost_per_lead: string
  email_roi: string
  has_budget: boolean
}

const COLORS = [
  'var(--color-primary-500)', '#6366f1', '#8b5cf6',
  '#ec4899', '#f59e0b', '#10b981',
]

interface Props {
  period: Period
}

export default function MarketingStats({ period }: Props) {
  const { t } = useTranslation()
  const { data, loading } = useStats<MarketingData>('marketing', period)

  const leadsChartData = (data?.leads_by_month ?? []).map((r) => ({
    month: r.month,
    revenue: r.count,
  }))

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={t('stats.marketing.leadsGenerated')}
          value={data ? data.total_leads : '—'}
          icon={<Target />}
          color="blue"
          loading={loading}
        />
        <KpiCard
          label={t('email.totalSent')}
          value={data ? data.email_stats.sent : '—'}
          icon={<Megaphone />}
          color="purple"
          loading={loading}
        />
        <KpiCard
          label={t('email.openRate')}
          value={data ? `${data.email_stats.open_rate}%` : '—'}
          icon={<Mail />}
          color="green"
          loading={loading}
        />
        <KpiCard
          label={t('email.clickRate')}
          value={data ? `${data.email_stats.click_rate}%` : '—'}
          icon={<MousePointerClick />}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Cost per lead + Email ROI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label={t('stats.marketing.costPerLead')}
          value={data ? (data.has_budget && data.cost_per_lead ? `${data.cost_per_lead}€` : t('stats.marketing.noBudget')) : '—'}
          icon={<Euro />}
          color="orange"
          loading={loading}
        />
        <KpiCard
          label={t('stats.marketing.emailRoi')}
          value={data ? `${data.email_roi}` : '—'}
          icon={<TrendingUp />}
          color="green"
          loading={loading}
        />
      </div>

      {/* Leads over time */}
      <RevenueChart
        data={leadsChartData}
        loading={loading}
        title={t('stats.marketing.leadsGenerated')}
        dataKey="revenue"
        color="#6366f1"
      />

      {/* Lead source pie */}
      <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
        <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.marketing.sources')}</h3>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data && data.by_source.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.by_source}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                >
                  {data.by_source.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _n, props) => [v, t(`leadSource.${props.payload.source}`)]}
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2">
              {data.by_source.map((s, i) => (
                <li key={s.source} className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm text-surface-700 flex-1">{t(`leadSource.${s.source}`)}</span>
                  <span className="text-sm font-semibold text-surface-900 tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-surface-400">{t('empty.leads')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
