import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Mail, Phone, Building2, User, Send } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import pb from '@/lib/pocketbase'
import type { Contact, ContactTag } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const tagVariant: Record<ContactTag, BadgeVariant> = {
  prospect: 'primary', client: 'success', partenaire: 'info', fournisseur: 'warning',
}

interface Props {
  contact: Contact & { expand?: { company?: { name: string }; owner?: { name: string } } }
  onEdit: () => void
  onDelete: () => void
  canEdit: boolean
  canDelete: boolean
}

export default function ContactDetail({ contact, onEdit, onDelete, canEdit, canDelete }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (date: string) => date ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(date)) : '—'

  const { items: templates, fetchTemplates } = useEmailTemplates()
  const [emailOpen, setEmailOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)

  function openEmailModal() {
    setSelectedTemplate('')
    setSendError(null)
    setSendSuccess(null)
    fetchTemplates()
    setEmailOpen(true)
  }

  async function handleSendEmail() {
    if (!selectedTemplate) { setSendError(t('email.selectTemplate')); return }
    setSendLoading(true)
    setSendError(null)
    setSendSuccess(null)
    try {
      await pb.send('/api/crm/send-email', {
        method: 'POST',
        body: JSON.stringify({ template_id: selectedTemplate, contact_id: contact.id }),
        headers: { 'Content-Type': 'application/json' },
      })
      setSendSuccess(t('email.sentSuccess'))
    } catch (err: any) {
      setSendError(err?.message || t('email.sendFailed'))
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900">{contact.first_name} {contact.last_name}</h2>
          {contact.position && <p className="text-sm text-surface-500 mt-0.5">{contact.position}</p>}
          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {contact.tags.map((tag) => <Badge key={tag} variant={tagVariant[tag]}>{t(`contactTag.${tag}`)}</Badge>)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {contact.email && (
            <Button variant="secondary" size="sm" icon={<Send className="h-3.5 w-3.5" />} onClick={openEmailModal}>
              {t('email.sendEmail')}
            </Button>
          )}
          {canEdit && <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>{t('common.edit')}</Button>}
          {canDelete && <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>{t('common.delete')}</Button>}
        </div>
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

      {/* Send Email Modal */}
      <Modal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title={t('email.sendEmail')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEmailOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleSendEmail}
              loading={sendLoading}
              icon={<Send className="h-4 w-4" />}
              disabled={!!sendSuccess}
            >
              {t('email.send')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {sendError && <Alert type="error">{sendError}</Alert>}
          {sendSuccess && <Alert type="success">{sendSuccess}</Alert>}

          <div className="text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">
            <span className="font-medium">{t('email.to')}:</span>{' '}
            <span>{contact.first_name} {contact.last_name}</span>
            {contact.email && <span className="text-surface-400 ml-1">&lt;{contact.email}&gt;</span>}
          </div>

          <Select
            label={t('entities.emailTemplate')}
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            options={[
              { value: '', label: `— ${t('email.selectTemplate')} —` },
              ...templates.map((tpl) => ({ value: tpl.id, label: tpl.name })),
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}
