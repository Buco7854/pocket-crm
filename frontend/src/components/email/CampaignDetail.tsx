import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Send, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import pb from '@/lib/pocketbase'
import type { Campaign, CampaignStatus, CampaignRun } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusVariant: Record<CampaignStatus, BadgeVariant> = {
  brouillon: 'default',
  en_cours: 'info',
  envoye: 'success',
}

const RUNS_PER_PAGE = 5

interface Props {
  campaign: Campaign & { expand?: { template?: { name: string } } }
  sending: boolean
  onEdit: () => void
  onDelete: () => void
  onSend: () => void
}

export default function CampaignDetail({ campaign, sending, onEdit, onDelete, onSend }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (d: string) =>
    d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : '—'
  const isSent = campaign.status === 'envoye'
  const isActive = campaign.status === 'en_cours'

  const [runs, setRuns] = useState<CampaignRun[]>([])
  const [runsPage, setRunsPage] = useState(1)

  useEffect(() => {
    pb.send(`/api/crm/campaigns/${campaign.id}/runs`, { method: 'GET' })
      .then((data: unknown) => setRuns(data as CampaignRun[]))
      .catch(() => {})
  }, [campaign.id])

  const totalRunPages = Math.ceil(runs.length / RUNS_PER_PAGE)
  const visibleRuns = runs.slice((runsPage - 1) * RUNS_PER_PAGE, runsPage * RUNS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header: status + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant[campaign.status]}>{t(`campaignStatus.${campaign.status}`)}</Badge>
          {isSent && campaign.sent > 0 && (
            <span className="text-sm text-surface-500">{campaign.sent}/{campaign.total} {t('email.sent')}</span>
          )}
          {isSent && campaign.failed > 0 && (
            <Badge variant="danger">{campaign.failed} {t('email.failed')}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!isActive && (
            <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
              {t('common.edit')}
            </Button>
          )}
          <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>
            {t('common.delete')}
          </Button>
          {!isActive && (
            <Button
              variant={isSent ? 'secondary' : 'primary'}
              size="sm"
              icon={isSent ? <RotateCcw className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              loading={sending}
              onClick={onSend}
            >
              {isSent ? t('email.relaunch') : t('email.sendNow')}
            </Button>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm border-t border-surface-200 pt-4">
        <div>
          <span className="text-surface-500">{t('entities.emailTemplate')}:</span>
          <span className="text-surface-900 ml-1">{(campaign as any).expand?.template?.name || '—'}</span>
        </div>
        <div>
          <span className="text-surface-500">{t('email.campaignContacts')}:</span>
          <span className="text-surface-900 ml-1">{campaign.total || campaign.contact_ids?.length || 0}</span>
        </div>
        {isSent && (
          <>
            <div>
              <span className="text-surface-500">{t('email.sent')}:</span>
              <span className="text-surface-900 ml-1">{campaign.sent}</span>
            </div>
            <div>
              <span className="text-surface-500">{t('email.failed')}:</span>
              <span className={`ml-1 ${campaign.failed > 0 ? 'text-danger-600' : 'text-surface-900'}`}>{campaign.failed}</span>
            </div>
          </>
        )}
        <div>
          <span className="text-surface-500">{t('fields.createdAt')}:</span>
          <span className="text-surface-900 ml-1">{fmt(campaign.created)}</span>
        </div>
      </div>

      {/* Send history */}
      {runs.length > 0 && (
        <div className="border-t border-surface-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-surface-400">
              {t('email.sendHistory')}
            </h4>
            <span className="text-xs text-surface-400">{runs.length} {t('email.runs')}</span>
          </div>

          <div className="divide-y divide-surface-100">
            {visibleRuns.map((run) => (
              <div key={run.id} className="flex items-center gap-3 py-2.5">
                {/* Run number badge */}
                <span className="text-xs font-semibold w-7 h-5 flex items-center justify-center bg-surface-100 rounded text-surface-600 tabular-nums shrink-0">
                  #{run.run_number}
                </span>

                {/* Date + recipients stacked */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-700 truncate">{fmt(run.sent_at)}</p>
                  <p className="text-xs text-surface-400">{run.total} {t('email.recipients')}</p>
                </div>

                {/* Result badges */}
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="success" size="sm">{run.sent}</Badge>
                  {run.failed > 0 && <Badge variant="danger" size="sm">{run.failed}</Badge>}
                </div>
              </div>
            ))}
          </div>

          {totalRunPages > 1 && (
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-surface-100">
              <button
                onClick={() => setRunsPage((p) => Math.max(1, p - 1))}
                disabled={runsPage === 1}
                className="cursor-pointer p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <span className="text-xs text-surface-400 tabular-nums">{runsPage} / {totalRunPages}</span>
              <button
                onClick={() => setRunsPage((p) => Math.min(totalRunPages, p + 1))}
                disabled={runsPage === totalRunPages}
                className="cursor-pointer p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
