import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Lead, LeadStatus, Priority } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const priorityVariant: Record<Priority, BadgeVariant> = {
  basse: 'default', moyenne: 'info', haute: 'warning', urgente: 'danger',
}

const allStatuses: LeadStatus[] = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu']

interface Props {
  lead: Lead & { expand?: { contact?: { first_name: string; last_name: string }; company?: { name: string }; owner?: { name: string } } }
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: LeadStatus) => void
  canEdit: boolean
  canDelete: boolean
}

export default function LeadDetail({ lead, onEdit, onDelete, onStatusChange, canEdit, canDelete }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'
  const fmtCurrency = (val: number) => val ? new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val) : '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900">{lead.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-lg font-semibold text-primary-600">{fmtCurrency(lead.value)}</span>
            <Badge variant={lead.status as LeadStatus}>{t(`status.${lead.status}`)}</Badge>
            <Badge variant={priorityVariant[lead.priority]} dot>{t(`priority.${lead.priority}`)}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {canEdit && <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>{t('common.edit')}</Button>}
          {canDelete && <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>{t('common.delete')}</Button>}
        </div>
      </div>

      {canEdit && (
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-2 uppercase tracking-wider">{t('fields.status')}</label>
          <div className="flex flex-wrap gap-1.5">
            {allStatuses.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  lead.status === s
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm border-t border-surface-200 pt-4">
        <div><span className="text-surface-500">{t('fields.source')}:</span> <span className="text-surface-900 ml-1">{lead.source ? t(`leadSource.${lead.source}`) : '—'}</span></div>
        <div>
          <span className="text-surface-500">{t('entities.contact')}:</span>
          <span className="text-surface-900 ml-1">
            {(lead as any).expand?.contact ? `${(lead as any).expand.contact.first_name} ${(lead as any).expand.contact.last_name}` : '—'}
          </span>
        </div>
        <div><span className="text-surface-500">{t('fields.company')}:</span> <span className="text-surface-900 ml-1">{(lead as any).expand?.company?.name || '—'}</span></div>
        <div><span className="text-surface-500">{t('fields.owner')}:</span> <span className="text-surface-900 ml-1">{(lead as any).expand?.owner?.name || '—'}</span></div>
        <div><span className="text-surface-500">{t('fields.expectedClose')}:</span> <span className="text-surface-900 ml-1">{fmt(lead.expected_close)}</span></div>
        {lead.closed_at && <div><span className="text-surface-500">{t('fields.closedAt')}:</span> <span className="text-surface-900 ml-1">{fmt(lead.closed_at)}</span></div>}
        <div><span className="text-surface-500">{t('fields.createdAt')}:</span> <span className="text-surface-900 ml-1">{fmt(lead.created)}</span></div>
        <div><span className="text-surface-500">{t('fields.updatedAt')}:</span> <span className="text-surface-900 ml-1">{fmt(lead.updated)}</span></div>
      </div>

      {lead.notes && (
        <div className="border-t border-surface-200 pt-4">
          <h4 className="text-sm font-medium text-surface-700 mb-2">{t('fields.notes')}</h4>
          <p className="text-sm text-surface-600 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}
    </div>
  )
}
