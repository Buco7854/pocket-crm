import { useTranslation } from 'react-i18next'
import { Mail, Phone, Building2, User } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { Contact, ContactTag } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const tagVariant: Record<ContactTag, BadgeVariant> = {
  prospect: 'primary', client: 'success', partenaire: 'info', fournisseur: 'warning',
}

interface Props {
  contact: Contact & { expand?: { company?: { name: string }; owner?: { name: string } } }
}

export default function ContactDetail({ contact }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (date: string) => date ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(date)) : '—'

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
    </div>
  )
}
