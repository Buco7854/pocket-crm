import { useTranslation } from 'react-i18next'

const STAGE_ORDER = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu']
const STAGE_COLORS: Record<string, string> = {
  nouveau:     'bg-slate-200 dark:bg-slate-700',
  contacte:    'bg-blue-200 dark:bg-blue-800',
  qualifie:    'bg-indigo-300 dark:bg-indigo-700',
  proposition: 'bg-violet-300 dark:bg-violet-700',
  negociation: 'bg-purple-400 dark:bg-purple-700',
  gagne:       'bg-green-400 dark:bg-green-700',
  perdu:       'bg-red-300 dark:bg-red-700',
}

interface FunnelItem {
  stage: string
  count: number
}

interface Props {
  data: FunnelItem[]
}

export default function ConversionFunnel({ data }: Props) {
  const { t } = useTranslation()

  const ordered = STAGE_ORDER.map((s) => {
    const found = data.find((d) => d.stage === s)
    return { stage: s, count: found?.count ?? 0 }
  }).filter((r) => r.count > 0)

  const maxCount = Math.max(...ordered.map((r) => r.count), 1)

  if (ordered.length === 0) {
    return <p className="text-sm text-surface-400 py-4">{t('empty.leads')}</p>
  }

  return (
    <div className="space-y-1.5">
      {ordered.map((item) => {
        const widthPct = Math.max((item.count / maxCount) * 100, 8)
        return (
          <div key={item.stage} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-right text-xs text-surface-500 font-medium">
              {t(`status.${item.stage}`)}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div
                className={`h-7 rounded-sm flex items-center justify-end pr-2 transition-all ${STAGE_COLORS[item.stage] ?? 'bg-surface-300'}`}
                style={{ width: `${widthPct}%` }}
              />
              <span className="text-xs font-semibold text-surface-700 tabular-nums w-6 shrink-0">{item.count}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
