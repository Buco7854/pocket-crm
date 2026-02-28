import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Eye, MousePointer, XCircle, TrendingUp, RefreshCw } from 'lucide-react'
import pb from '@/lib/pocketbase'
import { useEmailLogs } from '@/hooks/useEmailLogs'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { EmailLog, EmailLogStatus } from '@/types/models'

interface GlobalStats {
  total: number
  sent: number
  failed: number
  opened: number
  clicked: number
  openRate: number
  clickRate: number
}

interface CampaignStatsData {
  campaign_id: string
  total: number
  sent: number
  failed: number
  opened: number
  clicked: number
  open_rate: string
  click_rate: string
}

const statusVariant: Record<EmailLogStatus, string> = {
  envoye: 'success',
  echoue: 'danger',
  en_attente: 'default',
  ouvert: 'primary',
  clique: 'info',
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 bg-surface-0">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-surface-900">{value}</p>
        <p className="text-sm text-surface-500">{label}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function EmailStats() {
  const { t, i18n } = useTranslation()
  const { items: logs, loading, error, fetchLogs } = useEmailLogs()
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ total: 0, sent: 0, failed: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 })
  const [campaignStats, setCampaignStats] = useState<CampaignStatsData[]>([])
  const [loadingCampaign, setLoadingCampaign] = useState<Record<string, boolean>>({})
  const [campaignDetails, setCampaignDetails] = useState<Record<string, CampaignStatsData>>({})

  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'

  const load = useCallback(() => {
    fetchLogs({ page: 1 })
  }, [fetchLogs])

  useEffect(() => { load() }, [])

  // Build global stats from logs
  useEffect(() => {
    const stats: GlobalStats = { total: 0, sent: 0, failed: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 }
    for (const log of logs) {
      stats.total++
      if (log.status === 'envoye' || log.status === 'ouvert' || log.status === 'clique') stats.sent++
      if (log.status === 'echoue') stats.failed++
      if (log.open_count > 0) stats.opened++
      if (log.click_count > 0) stats.clicked++
    }
    if (stats.sent > 0) {
      stats.openRate = Math.round(stats.opened / stats.sent * 100)
      stats.clickRate = Math.round(stats.clicked / stats.sent * 100)
    }
    setGlobalStats(stats)

    // Collect unique campaign IDs
    const uniqueCampaigns = new Set<string>()
    for (const log of logs) { if (log.campaign_id) uniqueCampaigns.add(log.campaign_id) }
    // Build simple campaign list from logs
    const cMap = new Map<string, CampaignStatsData>()
    for (const log of logs) {
      if (!log.campaign_id) continue
      if (!cMap.has(log.campaign_id)) {
        cMap.set(log.campaign_id, { campaign_id: log.campaign_id, total: 0, sent: 0, failed: 0, opened: 0, clicked: 0, open_rate: '0', click_rate: '0' })
      }
      const c = cMap.get(log.campaign_id)!
      c.total++
      if (log.status === 'envoye' || log.status === 'ouvert' || log.status === 'clique') c.sent++
      if (log.status === 'echoue') c.failed++
      if (log.open_count > 0) c.opened++
      if (log.click_count > 0) c.clicked++
    }
    for (const c of cMap.values()) {
      if (c.sent > 0) {
        c.open_rate = (c.opened / c.sent * 100).toFixed(1)
        c.click_rate = (c.clicked / c.sent * 100).toFixed(1)
      }
    }
    setCampaignStats(Array.from(cMap.values()))
  }, [logs])

  async function loadCampaignStats(campaignId: string) {
    setLoadingCampaign((prev) => ({ ...prev, [campaignId]: true }))
    try {
      const res = await pb.send(`/api/crm/email/campaign-stats/${campaignId}`, { method: 'GET' })
      setCampaignDetails((prev) => ({ ...prev, [campaignId]: res as CampaignStatsData }))
    } finally {
      setLoadingCampaign((prev) => ({ ...prev, [campaignId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-surface-700">{t('email.globalStats')}</h3>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>
          {t('common.refresh')}
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Global KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Mail className="h-5 w-5" />} label={t('email.totalSent')} value={globalStats.sent} />
        <StatCard icon={<Eye className="h-5 w-5" />} label={t('email.openRate')} value={`${globalStats.openRate}%`} sub={`${globalStats.opened} / ${globalStats.sent}`} />
        <StatCard icon={<MousePointer className="h-5 w-5" />} label={t('email.clickRate')} value={`${globalStats.clickRate}%`} sub={`${globalStats.clicked} / ${globalStats.sent}`} />
        <StatCard icon={<XCircle className="h-5 w-5" />} label={t('email.failed')} value={globalStats.failed} />
      </div>

      {/* Per-campaign stats */}
      {campaignStats.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-surface-700 mb-3">{t('email.perCampaign')}</h3>
          <div className="space-y-2">
            {campaignStats.map((c) => {
              const detail = campaignDetails[c.campaign_id] ?? c
              return (
                <div key={c.campaign_id} className="border border-surface-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 p-3 bg-surface-50">
                    <TrendingUp className="h-4 w-4 text-surface-400 shrink-0" />
                    <span className="text-xs font-mono text-surface-500 flex-1 truncate">{c.campaign_id}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-surface-600">{detail.total} {t('email.recipients')}</span>
                      <Badge variant="success">{detail.sent} {t('email.sent')}</Badge>
                      {detail.failed > 0 && <Badge variant="danger">{detail.failed}</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={loadingCampaign[c.campaign_id]}
                      onClick={() => loadCampaignStats(c.campaign_id)}
                    >
                      {t('email.details')}
                    </Button>
                  </div>
                  {campaignDetails[c.campaign_id] && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4 bg-surface-0 border-t border-surface-100 text-sm">
                      <div>
                        <p className="text-surface-500 text-xs">{t('email.openRate')}</p>
                        <p className="font-semibold text-surface-900">{detail.open_rate}%</p>
                        <p className="text-xs text-surface-400">{detail.opened}/{detail.sent}</p>
                      </div>
                      <div>
                        <p className="text-surface-500 text-xs">{t('email.clickRate')}</p>
                        <p className="font-semibold text-surface-900">{detail.click_rate}%</p>
                        <p className="text-xs text-surface-400">{detail.clicked}/{detail.sent}</p>
                      </div>
                      <div>
                        <p className="text-surface-500 text-xs">{t('email.failed')}</p>
                        <p className={`font-semibold ${detail.failed > 0 ? 'text-danger-600' : 'text-surface-900'}`}>{detail.failed}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {campaignStats.length === 0 && !loading && (
        <div className="text-center py-10 text-surface-400 text-sm">{t('empty.emailStats')}</div>
      )}
    </div>
  )
}
