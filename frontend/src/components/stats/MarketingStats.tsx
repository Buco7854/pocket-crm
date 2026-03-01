import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useStats } from '@/hooks/useStats'
import type { Period } from './PeriodFilter'
import KpiCard from '@/components/dashboard/KpiCard'
import RevenueChart from './RevenueChart'
import Skeleton from '@/components/dashboard/Skeleton'
import { Target, Mail, MousePointerClick, Megaphone, TrendingUp, Euro, ExternalLink } from 'lucide-react'
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, BAR_CURSOR } from './chartUtils'
import Button from '@/components/ui/Button'

interface EmailStats {
  total: number
  sent: number
  open_rate: string
  click_rate: string
}

interface RoiChannelRow {
  category: string
  cost: number
  revenue: number
  leads: number
  deals: number
  roi: number
  roas: number
  cpa: number
}

interface CampaignPerf {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  emails_sent: number
  leads_count: number
  revenue_won: number
  deals_won: number
  cost: number
  roi: number
  roas: number
  cpa: number
}

interface MarketingData {
  leads_by_month: { month: string; count: number }[]
  by_source: { source: string; count: number }[]
  total_leads: number
  email_stats: EmailStats
  cost_per_lead: string
  total_expenses: number
  has_expenses: boolean
  roi_global: number
  roas_global: number
  roi_by_channel: RoiChannelRow[]
  by_campaign: CampaignPerf[]
}

const COLORS = [
  'var(--color-primary-500)', '#6366f1', '#8b5cf6',
  '#ec4899', '#f59e0b', '#10b981',
]

function fmtMoney(n: number | undefined | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k€`
  return `${n.toFixed(0)}€`
}

function fmtRoas(n: number | undefined | null) {
  if (n == null) return '—'
  return `${n.toFixed(1)}x`
}

interface Props {
  period: Period
}

export default function MarketingStats({ period }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, loading } = useStats<MarketingData>('marketing', period)

  const leadsChartData = (data?.leads_by_month ?? []).map((r) => ({
    month: r.month,
    revenue: r.count,
  }))

  const roiChartData = (data?.roi_by_channel ?? []).map((r) => ({
    name: t(`leadSource.${r.category}`),
    roi: Math.round(r.roi),
    cost: r.cost,
    revenue: r.revenue,
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

      {/* ROI global + ROAS + dépenses totales + CPL */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={t('stats.marketing.roiGlobal')}
          value={
            data
              ? data.has_expenses
                ? `${(data.roi_global ?? 0).toFixed(1)}%`
                : t('stats.marketing.noExpenses')
              : '—'
          }
          icon={<TrendingUp />}
          color={data && (data.roi_global ?? 0) >= 0 ? 'green' : 'red'}
          loading={loading}
        />
        <KpiCard
          label={t('stats.marketing.roasGlobal')}
          value={
            data
              ? data.has_expenses
                ? fmtRoas(data.roas_global)
                : t('stats.marketing.noExpenses')
              : '—'
          }
          icon={<TrendingUp />}
          color={data && (data.roas_global ?? 0) >= 1 ? 'green' : 'red'}
          loading={loading}
        />
        <KpiCard
          label={t('stats.marketing.totalExpenses')}
          value={data ? (data.has_expenses ? fmtMoney(data.total_expenses) : '0€') : '—'}
          icon={<Euro />}
          color="orange"
          loading={loading}
        />
        <KpiCard
          label={t('stats.marketing.costPerLead')}
          value={data ? (data.cost_per_lead ? `${data.cost_per_lead}€` : t('stats.marketing.noBudget')) : '—'}
          icon={<Euro />}
          color="orange"
          loading={loading}
        />
      </div>

      {/* ROI par canal */}
      <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-surface-900">{t('stats.marketing.roiByChannel')}</h3>
          <Button
            variant="ghost"
            size="sm"
            icon={<ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={() => navigate('/marketing-expenses')}
          >
            {t('marketingExpenses.manage')}
          </Button>
        </div>
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : data && data.roi_by_channel.length > 0 ? (
          <div className="space-y-4">
            {/* Bar chart ROI */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roiChartData} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-surface-200)" />
                <XAxis
                  type="number"
                  tickFormatter={(v: unknown) => `${Number(v)}%`}
                  tick={{ fontSize: 11, fill: 'var(--color-surface-500)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fill: 'var(--color-surface-600)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => {
                    if (name === 'roi') return [`${Number(v).toFixed(1)}%`, t('stats.marketing.roi')]
                    return [fmtMoney(Number(v)), String(name)]
                  }}
                  labelFormatter={(l: unknown) => String(l)}
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={BAR_CURSOR}
                />
                <Bar dataKey="roi" fill="var(--color-primary-500)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Table détail */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="pb-2 text-left font-medium text-surface-500">{t('stats.marketing.channel')}</th>
                    <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.cost')}</th>
                    <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.revenue')}</th>
                    <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.leads')}</th>
                    <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.dealsWon')}</th>
                    <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.roi')}</th>
                    <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.roas')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.roi_by_channel.map((r) => (
                    <tr key={r.category} className="border-b border-surface-100 last:border-0">
                      <td className="py-2 text-surface-700">{t(`leadSource.${r.category}`)}</td>
                      <td className="py-2 text-right tabular-nums text-surface-600">{r.cost > 0 ? fmtMoney(r.cost) : '—'}</td>
                      <td className="py-2 text-right tabular-nums text-surface-600">{r.revenue > 0 ? fmtMoney(r.revenue) : '—'}</td>
                      <td className="py-2 text-right tabular-nums text-surface-600">{r.leads}</td>
                      <td className="py-2 text-right tabular-nums text-surface-600">{r.deals}</td>
                      <td className={`py-2 text-right tabular-nums font-semibold ${r.cost > 0 ? (r.roi >= 0 ? 'text-green-600' : 'text-red-600') : 'text-surface-400'}`}>
                        {r.cost > 0 ? `${(r.roi ?? 0).toFixed(1)}%` : '—'}
                      </td>
                      <td className={`py-2 text-right tabular-nums font-semibold ${r.cost > 0 ? 'text-surface-700' : 'text-surface-400'}`}>
                        {r.cost > 0 ? fmtRoas(r.roas) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-surface-400">{t('stats.marketing.noExpenses')}</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/marketing-expenses')}>
              {t('marketingExpenses.addExpense')}
            </Button>
          </div>
        )}
      </div>

      {/* Performance par campagne */}
      <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
        <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.marketing.byCampaign')}</h3>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : data && data.by_campaign && data.by_campaign.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="pb-2 text-left font-medium text-surface-500">{t('fields.name')}</th>
                  <th className="pb-2 text-left font-medium text-surface-500">{t('campaign.type')}</th>
                  <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.cost')}</th>
                  <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.leads')}</th>
                  <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.dealsWon')}</th>
                  <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.revenue')}</th>
                  <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.roi')}</th>
                  <th className="pb-2 text-right font-medium text-surface-500">{t('stats.marketing.roas')}</th>
                </tr>
              </thead>
              <tbody>
                {data.by_campaign.map((c) => (
                  <tr key={c.campaign_id} className="border-b border-surface-100 last:border-0">
                    <td className="py-2 text-surface-700 font-medium">{c.campaign_name}</td>
                    <td className="py-2 text-surface-500">{t(`campaignType.${c.campaign_type}`)}</td>
                    <td className="py-2 text-right tabular-nums text-surface-600">{c.cost > 0 ? fmtMoney(c.cost) : '—'}</td>
                    <td className="py-2 text-right tabular-nums text-surface-600">{c.leads_count}</td>
                    <td className="py-2 text-right tabular-nums text-surface-600">{c.deals_won}</td>
                    <td className="py-2 text-right tabular-nums text-surface-600">{fmtMoney(c.revenue_won)}</td>
                    <td className={`py-2 text-right tabular-nums font-semibold ${c.cost > 0 ? (c.roi >= 0 ? 'text-green-600' : 'text-red-600') : 'text-surface-400'}`}>
                      {c.cost > 0 ? `${(c.roi ?? 0).toFixed(1)}%` : '—'}
                    </td>
                    <td className={`py-2 text-right tabular-nums font-semibold ${c.cost > 0 ? 'text-surface-700' : 'text-surface-400'}`}>
                      {c.cost > 0 ? fmtRoas(c.roas) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-surface-400">{t('stats.marketing.noCampaigns')}</p>
          </div>
        )}
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
