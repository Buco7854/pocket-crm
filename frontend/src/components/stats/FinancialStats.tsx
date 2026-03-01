import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useStats } from '@/hooks/useStats'
import type { Period } from './PeriodFilter'
import KpiCard from '@/components/dashboard/KpiCard'
import RevenueChart from './RevenueChart'
import Skeleton from '@/components/dashboard/Skeleton'
import { Clock, TrendingUp, FileText } from 'lucide-react'
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, BAR_CURSOR } from './chartUtils'

interface InvoiceStatusRow {
  status: string
  count: number
  amount: number
}

interface ForecastRow {
  stage: string
  total_amount: number
  weighted: number
}

interface FinancialData {
  by_status: InvoiceStatusRow[]
  avg_payment_delay: string
  forecast: string
  forecast_by_stage: ForecastRow[]
  revenue_by_month: { month: string; amount: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  payee:     '#10b981',
  emise:     '#3b82f6',
  en_retard: '#ef4444',
  brouillon: '#94a3b8',
  annulee:   '#d1d5db',
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`
  return `${n}€`
}

interface Props {
  period: Period
}

export default function FinancialStats({ period }: Props) {
  const { t } = useTranslation()
  const { data, loading } = useStats<FinancialData>('financial', period)

  const totalInvoices = data?.by_status.reduce((s, r) => s + r.count, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label={t('invoices.invoice')}
          value={data ? totalInvoices : '—'}
          icon={<FileText />}
          color="blue"
          loading={loading}
        />
        <KpiCard
          label={t('stats.financial.avgDelay')}
          value={data ? `${data.avg_payment_delay}j` : '—'}
          icon={<Clock />}
          color="orange"
          loading={loading}
        />
        <KpiCard
          label={t('stats.financial.forecast')}
          value={data ? fmtMoney(Number(data.forecast)) : '—'}
          icon={<TrendingUp />}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Invoice status + paid amounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie: count by status */}
        <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.financial.invoices')} — {t('fields.status')}</h3>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : data && data.by_status.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-auto shrink-0">
                <ResponsiveContainer width="100%" height={180} minWidth={180}>
                  <PieChart>
                    <Pie
                      data={data.by_status}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                    >
                      {data.by_status.map((r, i) => (
                        <Cell key={i} fill={STATUS_COLORS[r.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown, _name: unknown, props: { payload?: { status?: string } }) => [String(v), t(`invoiceStatus.${props.payload?.status ?? ''}`)]}
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 w-full">
                {data.by_status.map((r) => (
                  <li key={r.status} className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: STATUS_COLORS[r.status] ?? '#94a3b8' }} />
                    <span className="text-sm text-surface-700 flex-1">{t(`invoiceStatus.${r.status}`)}</span>
                    <span className="text-sm font-semibold text-surface-900 tabular-nums">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-surface-400">{t('empty.invoices')}</p>
            </div>
          )}
        </div>

        {/* Revenue forecast by stage */}
        <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-1">{t('stats.financial.forecast')}</h3>
          <p className="text-xs text-surface-400 mb-4">{t('stats.financial.forecastHint')}</p>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : data && data.forecast_by_stage.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.forecast_by_stage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
                <XAxis
                  dataKey="stage"
                  tickFormatter={(v) => t(`status.${v}`)}
                  tick={{ fontSize: 10, fill: 'var(--color-surface-500)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-surface-500)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtMoney}
                />
                <Tooltip
                  cursor={BAR_CURSOR}
                  formatter={(v: unknown, name: unknown) => [fmtMoney(Number(v)), name === 'weighted' ? t('stats.financial.forecast') : t('common.total')]}
                  labelFormatter={(l: unknown) => t(`status.${String(l)}`)}
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Bar dataKey="total_amount" fill="var(--color-surface-400)" radius={[4, 4, 0, 0]} name="total" />
                <Bar dataKey="weighted" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} name="weighted" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-surface-400">{t('empty.leads')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue by month (paid invoices) */}
      <RevenueChart
        data={(data?.revenue_by_month ?? []).map((r) => ({ month: r.month, revenue: r.amount }))}
        loading={loading}
        title={`${t('stats.kpi.revenue')} — ${t('invoiceStatus.payee')}`}
        dataKey="revenue"
        color="#10b981"
      />
    </div>
  )
}
