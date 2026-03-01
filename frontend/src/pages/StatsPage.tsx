import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Users, Medal, Receipt, Megaphone, RefreshCw } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'
import PeriodFilter, { type Period } from '@/components/stats/PeriodFilter'
import SalesStats from '@/components/stats/SalesStats'
import ClientStats from '@/components/stats/ClientStats'
import CommercialLeaderboard from '@/components/stats/CommercialLeaderboard'
import FinancialStats from '@/components/stats/FinancialStats'
import MarketingStats from '@/components/stats/MarketingStats'

type StatsTab = 'sales' | 'clients' | 'commercials' | 'financial' | 'marketing'

export default function StatsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<StatsTab>('sales')
  const [period, setPeriod] = useState<Period>('month')
  // key trick: increment to force re-mount children and re-fetch
  const [refreshKey, setRefreshKey] = useState(0)

  const tabs = [
    { key: 'sales' as const,       label: t('stats.tabs.sales'),       icon: <TrendingUp className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'clients' as const,     label: t('stats.tabs.clients'),     icon: <Users className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'commercials' as const, label: t('stats.tabs.commercials'), icon: <Medal className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'financial' as const,   label: t('stats.tabs.financial'),   icon: <Receipt className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'marketing' as const,   label: t('stats.tabs.marketing'),   icon: <Megaphone className="h-4 w-4" strokeWidth={1.75} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">{t('nav.stats')}</h1>
          <p className="mt-0.5 text-sm text-surface-500">{t('stats.pageDescription')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodFilter value={period} onChange={setPeriod} />
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 bg-surface-100 hover:bg-surface-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Content */}
      <div key={`${tab}-${period}-${refreshKey}`}>
        {tab === 'sales'       && <SalesStats period={period} />}
        {tab === 'clients'     && <ClientStats period={period} />}
        {tab === 'commercials' && <CommercialLeaderboard period={period} />}
        {tab === 'financial'   && <FinancialStats period={period} />}
        {tab === 'marketing'   && <MarketingStats period={period} />}
      </div>
    </div>
  )
}
