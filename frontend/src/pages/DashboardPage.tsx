import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DollarSign, Users, CalendarClock, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import KpiCard from '@/components/dashboard/KpiCard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import PipelineWidget from '@/components/dashboard/PipelineWidget'
import PeriodFilter, { type Period } from '@/components/stats/PeriodFilter'
import Skeleton from '@/components/dashboard/Skeleton'

function fmtRevenue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`
  return `${n}€`
}

function fmtMonth(m: string): string {
  try {
    const [year, month] = m.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('fr-FR', {
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return m
  }
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<Period>('month')
  const { data, loading, error, refresh } = useDashboard(period)

  const evoLabel = t('stats.evolution.vs')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">{t('nav.dashboard')}</h1>
          <p className="mt-0.5 text-sm text-surface-500">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodFilter value={period} onChange={setPeriod} />
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 bg-surface-100 hover:bg-surface-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={t('stats.kpi.revenue')}
          value={data ? fmtRevenue(data.revenue.current) : '—'}
          icon={<DollarSign />}
          evolution={data ? Number(data.revenue.evolution_pct) : undefined}
          evolutionLabel={evoLabel}
          color="green"
          loading={loading}
        />
        <KpiCard
          label={t('stats.kpi.prospects')}
          value={data ? data.new_prospects.current : '—'}
          icon={<Users />}
          evolution={data ? Number(data.new_prospects.evolution_pct) : undefined}
          evolutionLabel={evoLabel}
          color="blue"
          loading={loading}
        />
        <KpiCard
          label={t('stats.kpi.meetings')}
          value={data ? data.meetings_today : '—'}
          icon={<CalendarClock />}
          color="purple"
          loading={loading}
        />
        <KpiCard
          label={t('stats.kpi.overdueTasks')}
          value={data ? data.overdue_tasks : '—'}
          icon={<AlertTriangle />}
          color={data && data.overdue_tasks > 0 ? 'red' : 'orange'}
          loading={loading}
        />
      </div>

      {/* Revenue Goal Widget */}
      {(loading || (data && Number(data.revenue_goal_pct) > 0)) && (
        <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-surface-900">{t('stats.dashboard.revenueGoal')}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{t('stats.dashboard.revenueGoalHint')}</p>
            </div>
            {!loading && data && (
              <span className={`text-lg font-bold tabular-nums ${
                Number(data.revenue_goal_pct) >= 100
                  ? 'text-green-600'
                  : Number(data.revenue_goal_pct) >= 70
                  ? 'text-orange-500'
                  : 'text-red-500'
              }`}>
                {Math.min(Number(data.revenue_goal_pct), 999).toFixed(0)}%
              </span>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-3 w-full rounded-full" />
          ) : data ? (
            <div className="space-y-1.5">
              <div className="w-full bg-surface-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${
                    Number(data.revenue_goal_pct) >= 100
                      ? 'bg-green-500'
                      : Number(data.revenue_goal_pct) >= 70
                      ? 'bg-orange-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(Number(data.revenue_goal_pct), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-surface-400">
                <span>{fmtRevenue(data.revenue.current)}</span>
                <span>{t('stats.dashboard.goalAchieved')}: {fmtRevenue(data.revenue.previous)}</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Revenue trend + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-xl bg-surface-0 border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">{t('stats.sales.revenue')}</h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : data && (data.revenue_trend ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={(data.revenue_trend ?? []).map((r) => ({ ...r, month: fmtMonth(r.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--color-surface-500)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-surface-500)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => fmtRevenue(v)}
                />
                <Tooltip
                  formatter={(v: unknown) => [fmtRevenue(Number(v)), t('stats.kpi.revenue')]}
                  contentStyle={{
                    background: 'var(--color-surface-0)',
                    border: '1px solid var(--color-surface-200)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--color-surface-900)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary-600)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-surface-400">{t('empty.leads')}</p>
            </div>
          )}
        </div>

        {/* Pipeline */}
        <PipelineWidget
          stages={data?.pipeline_by_stage ?? []}
          loading={loading}
        />
      </div>

      {/* Activity feed */}
      <ActivityFeed
        activities={data?.recent_activities ?? []}
        loading={loading}
      />
    </div>
  )
}
