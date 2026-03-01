import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useStats } from '@/hooks/useStats'
import type { Period } from './PeriodFilter'
import RevenueChart from './RevenueChart'
import ConversionFunnel from './ConversionFunnel'
import Skeleton from '@/components/dashboard/Skeleton'
import KpiCard from '@/components/dashboard/KpiCard'
import { TrendingUp, Clock, Award } from 'lucide-react'

interface SalesData {
  revenue_by_month: { month: string; revenue: number }[]
  by_salesperson: { name: string; revenue: number; deals: number }[]
  pipeline: { stage: string; count: number; amount: number }[]
  funnel: { stage: string; count: number }[]
  conversion_rate: string
  avg_close_days: string
}

function fmtRevenue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`
  return `${n}€`
}

interface Props {
  period: Period
}

export default function SalesStats({ period }: Props) {
  const { t } = useTranslation()
  const { data, loading } = useStats<SalesData>('sales', period)

  const totalPipelineAmount = data?.pipeline.reduce((s, r) => s + r.amount, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label={t('stats.sales.conversionRate')}
          value={data ? `${data.conversion_rate}%` : '—'}
          icon={<Award />}
          color="green"
          loading={loading}
        />
        <KpiCard
          label={t('stats.financial.forecast')}
          value={data ? fmtRevenue(totalPipelineAmount) : '—'}
          icon={<TrendingUp />}
          color="blue"
          loading={loading}
        />
        <KpiCard
          label={t('stats.sales.avgCloseDays')}
          value={data ? `${data.avg_close_days}j` : '—'}
          icon={<Clock />}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Revenue chart */}
      <RevenueChart
        data={data?.revenue_by_month ?? []}
        loading={loading}
        title={t('stats.sales.revenue')}
      />

      {/* By salesperson + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by salesperson */}
        <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.sales.bySalesperson')}</h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : data && data.by_salesperson.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.by_salesperson} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'var(--color-surface-500)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtRevenue}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: 'var(--color-surface-600)' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(v: unknown) => [fmtRevenue(Number(v)), t('stats.kpi.revenue')]}
                  contentStyle={{
                    background: 'var(--color-surface-0)',
                    border: '1px solid var(--color-surface-200)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="var(--color-primary-500)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-surface-400">{t('empty.leads')}</p>
            </div>
          )}
        </div>

        {/* Conversion funnel */}
        <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.sales.funnel')}</h3>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-sm" />
              ))}
            </div>
          ) : (
            <ConversionFunnel data={data?.funnel ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}
