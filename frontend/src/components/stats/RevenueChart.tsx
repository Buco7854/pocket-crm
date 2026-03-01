import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
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
      month: 'short', year: '2-digit',
    })
  } catch {
    return m
  }
}

interface DataPoint {
  month: string
  revenue?: number
  amount?: number
}

interface Props {
  data: DataPoint[]
  loading?: boolean
  title?: string
  dataKey?: string
  color?: string
  height?: number
}

export default function RevenueChart({
  data, loading = false, title, dataKey = 'revenue', color = 'var(--color-primary-600)', height = 220,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl bg-surface-0 border border-surface-200 p-5">
      {title && <h3 className="text-sm font-semibold text-surface-900 mb-4">{title}</h3>}
      {loading ? (
        <Skeleton className={`w-full`} style={{ height }} />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm text-surface-400">{t('empty.leads')}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data.map((r) => ({ ...r, _month: fmtMonth(r.month) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
            <XAxis
              dataKey="_month"
              tick={{ fontSize: 11, fill: 'var(--color-surface-500)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-surface-500)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtRevenue}
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
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
