import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Eye, MousePointer, XCircle, TrendingUp, RefreshCw, ChevronDown } from 'lucide-react'
import pb from '@/lib/pocketbase'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useAsync } from '@/hooks/useAsync'

const STATS_PAGE_SIZE = 10

interface GlobalStats {
  total: number
  sent: number
  failed: number
  opened: number
  clicked: number
  open_rate: string
  click_rate: string
}

interface CampaignStatItem {
  campaign_id: string
  campaign_name: string
  campaign_status: string
  total: number
  sent: number
  failed: number
  opened: number
  clicked: number
  open_rate: string
  click_rate: string
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 bg-surface-0">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-surface-900 tabular-nums truncate">{value}</p>
        <p className="text-xs text-surface-500 truncate">{label}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

async function fetchStats(): Promise<{ global: GlobalStats; campaigns: CampaignStatItem[] }> {
  const [global, campaigns] = await Promise.all([
    pb.send('/api/crm/email/global-stats', { method: 'GET' }) as Promise<GlobalStats>,
    pb.send('/api/crm/email/campaign-stats-list', { method: 'GET' }) as Promise<CampaignStatItem[]>,
  ])
  return { global, campaigns }
}

export default function EmailStats() {
  const { t } = useTranslation()
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())

  const { data, loading, error, execute: reloadStats } = useAsync(fetchStats, { immediate: true })
  const [statsPage, setStatsPage] = useState(1)

  function reload() {
    setStatsPage(1)
    reloadStats()
  }

  const globalStats = data?.global
  const campaignStats = data?.campaigns ?? []
  const totalStatsPages = Math.ceil(campaignStats.length / STATS_PAGE_SIZE)
  const visibleCampaigns = campaignStats.slice((statsPage - 1) * STATS_PAGE_SIZE, statsPage * STATS_PAGE_SIZE)

  const toggleCampaign = useCallback((id: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-surface-700">{t('email.globalStats')}</h3>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={reload} loading={loading}>
          {t('common.refresh')}
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Global KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Mail className="h-5 w-5" />} label={t('email.totalSent')} value={globalStats?.sent ?? '—'} />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label={t('email.openRate')}
          value={globalStats ? `${globalStats.open_rate}%` : '—'}
          sub={globalStats ? `${globalStats.opened} / ${globalStats.sent}` : undefined}
        />
        <StatCard
          icon={<MousePointer className="h-5 w-5" />}
          label={t('email.clickRate')}
          value={globalStats ? `${globalStats.click_rate}%` : '—'}
          sub={globalStats ? `${globalStats.clicked} / ${globalStats.sent}` : undefined}
        />
        <StatCard icon={<XCircle className="h-5 w-5" />} label={t('email.failed')} value={globalStats?.failed ?? '—'} />
      </div>

      {/* Per-campaign stats */}
      {campaignStats.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-surface-700 mb-3">{t('email.perCampaign')}</h3>
          <div className="space-y-2">
            {visibleCampaigns.map((c) => {
              const expanded = expandedCampaigns.has(c.campaign_id)
              return (
                <div key={c.campaign_id} className="border border-surface-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    className="cursor-pointer w-full text-left"
                    onClick={() => toggleCampaign(c.campaign_id)}
                  >
                    <div className="flex items-center gap-3 p-3 bg-surface-50 hover:bg-surface-100 transition-colors">
                      <TrendingUp className="h-4 w-4 text-surface-400 shrink-0" />
                      <span className="text-sm font-medium text-surface-700 flex-1 truncate min-w-0">
                        {c.campaign_name}
                      </span>
                      <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap justify-end">
                        <span className="text-surface-500 hidden sm:inline">{c.total} {t('email.recipients')}</span>
                        <Badge variant="success">{c.sent} {t('email.sent')}</Badge>
                        {c.failed > 0 && <Badge variant="danger">{c.failed}</Badge>}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-surface-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                        strokeWidth={2}
                      />
                    </div>
                  </button>

                  {expanded && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface-0 border-t border-surface-100 text-sm">
                      <div>
                        <p className="text-surface-500 text-xs">{t('email.openRate')}</p>
                        <p className="font-semibold text-surface-900">{c.open_rate}%</p>
                        <p className="text-xs text-surface-400">{c.opened}/{c.sent}</p>
                      </div>
                      <div>
                        <p className="text-surface-500 text-xs">{t('email.clickRate')}</p>
                        <p className="font-semibold text-surface-900">{c.click_rate}%</p>
                        <p className="text-xs text-surface-400">{c.clicked}/{c.sent}</p>
                      </div>
                      <div>
                        <p className="text-surface-500 text-xs">{t('email.failed')}</p>
                        <p className={`font-semibold ${c.failed > 0 ? 'text-danger-600' : 'text-surface-900'}`}>{c.failed}</p>
                      </div>
                      <div>
                        <p className="text-surface-500 text-xs">{t('email.recipients')}</p>
                        <p className="font-semibold text-surface-900">{c.total}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {totalStatsPages > 1 && (
            <Pagination
              page={statsPage}
              totalPages={totalStatsPages}
              totalItems={campaignStats.length}
              perPage={STATS_PAGE_SIZE}
              onPageChange={setStatsPage}
            />
          )}
        </div>
      )}

      {campaignStats.length === 0 && !loading && (
        <div className="text-center py-10 text-surface-400 text-sm">{t('empty.emailStats')}</div>
      )}
    </div>
  )
}
