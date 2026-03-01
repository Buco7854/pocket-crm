import { useTranslation } from 'react-i18next'

export type Period = 'week' | 'month' | 'quarter' | 'year'

interface Props {
  value: Period
  onChange: (p: Period) => void
}

const PERIODS: Period[] = ['week', 'month', 'quarter', 'year']

export default function PeriodFilter({ value, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-1 p-1 bg-surface-100 rounded-lg w-fit shrink-0">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            value === p
              ? 'bg-surface-0 text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          {t(`stats.period.${p}`)}
        </button>
      ))}
    </div>
  )
}
