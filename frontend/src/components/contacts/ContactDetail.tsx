import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, Building2, User } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useEmailLogs } from '@/hooks/useEmailLogs'
import type { Contact, ContactTag, EmailLogStatus } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const tagVariant: Record<ContactTag, BadgeVariant> = {
  prospect: 'primary', client: 'success', partenaire: 'info', fournisseur: 'warning',
}

const logStatusVariant: Record<EmailLogStatus, BadgeVariant> = {
  envoye: 'success',
  echoue: 'danger',
  en_attente: 'warning',
  ouvert: 'info',
  clique: 'primary',
}

interface Props {
  contact: Contact & { expand?: { company?: { name: string }; owner?: { name: string } } }
}

export default function ContactDetail({ contact }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (date: string) => date ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(date)) : '—'
  const fmtDateTime = (date: string) => date ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : '—'

  const { items: commLogs, loading: logsLoading, fetchLogs } = useEmailLogs()

  useEffect(() => {
    fetchLogs({ contactId: contact.id })
  }, [contact.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-900">{contact.first_name} {contact.last_name}</h2>
        {contact.position && <p className="text-sm text-surface-500 mt-0.5">{contact.position}</p>}
        {contact.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {contact.tags.map((tag) => <Badge key={tag} variant={tagVariant[tag]}>{t(`contactTag.${tag}`)}</Badge>)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {contact.email && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <Mail className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <a href={`mailto:${contact.email}`} className="hover:underline break-all min-w-0">{contact.email}</a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <Phone className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <a href={`tel:${contact.phone}`} className="hover:underline min-w-0">{contact.phone}</a>
          </div>
        )}
        {(contact as any).expand?.company?.name && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <Building2 className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <span className="min-w-0">{(contact as any).expand.company.name}</span>
          </div>
        )}
        {(contact as any).expand?.owner?.name && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <User className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <span className="min-w-0">{t('fields.owner')}: {(contact as any).expand.owner.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm border-t border-surface-200 pt-4">
        <div><span className="text-surface-500">{t('fields.createdAt')}:</span> <span className="text-surface-900 ml-1">{fmt(contact.created)}</span></div>
        <div><span className="text-surface-500">{t('fields.updatedAt')}:</span> <span className="text-surface-900 ml-1">{fmt(contact.updated)}</span></div>
      </div>

      {contact.notes && (
        <div className="border-t border-surface-200 pt-4">
          <h4 className="text-sm font-medium text-surface-700 mb-2">{t('fields.notes')}</h4>
          <p className="text-sm text-surface-600 whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}

      {/* Communication history */}
      <div className="border-t border-surface-200 pt-4">
        <h4 className="text-sm font-medium text-surface-700 mb-3">{t('contacts.communicationHistory')}</h4>
        {logsLoading ? (
          <div className="flex justify-center py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : commLogs.length === 0 ? (
          <p className="text-sm text-surface-400">{t('contacts.noCommunications')}</p>
        ) : (
          <div className="divide-y divide-surface-100">
            {commLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-700 truncate">{log.subject}</p>
                  <p className="text-xs text-surface-400">{fmtDateTime(log.sent_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={logStatusVariant[log.status]} size="sm">{t(`emailLogStatus.${log.status}`)}</Badge>
                  {log.open_count > 0 && (
                    <span className="text-xs text-surface-400 tabular-nums">{log.open_count} ouv.</span>
                  )}
                  {log.click_count > 0 && (
                    <span className="text-xs text-surface-400 tabular-nums">{log.click_count} clics</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
