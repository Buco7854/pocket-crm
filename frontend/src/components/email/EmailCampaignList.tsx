import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Users, ChevronRight } from 'lucide-react'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import { useEmailLogs } from '@/hooks/useEmailLogs'
import { useCollection } from '@/hooks/useCollection'
import pb from '@/lib/pocketbase'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import type { EmailTemplate, Contact } from '@/types/models'

interface CampaignSummary {
  campaign_id: string
  template_name: string
  total: number
  sent: number
  failed: number
  last_sent: string
}

export default function EmailCampaignList() {
  const { t, i18n } = useTranslation()
  const { items: templates, fetchTemplates } = useEmailTemplates()
  const { items: logs, loading: logsLoading, fetchLogs } = useEmailLogs()
  const contactsCollection = useCollection<Contact>('contacts')

  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [sendOpen, setSendOpen] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : '—'

  useEffect(() => { fetchTemplates() }, [])

  useEffect(() => {
    fetchLogs().then(() => {})
  }, [])

  // Build campaign summaries from logs
  useEffect(() => {
    const map = new Map<string, CampaignSummary>()
    for (const log of logs) {
      if (!log.campaign_id) continue
      const tplName = (log as any).expand?.template?.name || '—'
      if (!map.has(log.campaign_id)) {
        map.set(log.campaign_id, {
          campaign_id: log.campaign_id,
          template_name: tplName,
          total: 0, sent: 0, failed: 0,
          last_sent: log.sent_at || log.created,
        })
      }
      const s = map.get(log.campaign_id)!
      s.total++
      if (log.status === 'envoye' || log.status === 'ouvert' || log.status === 'clique') s.sent++
      if (log.status === 'echoue') s.failed++
      if ((log.sent_at || log.created) > s.last_sent) s.last_sent = log.sent_at || log.created
    }
    setCampaigns(Array.from(map.values()).sort((a, b) => b.last_sent.localeCompare(a.last_sent)))
  }, [logs])

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true)
    try {
      const res = await contactsCollection.fetchList({ perPage: 200, sort: 'last_name', fields: 'id,first_name,last_name,email' })
      if (res) setContacts(res.items.filter((c) => c.email))
    } finally {
      setLoadingContacts(false)
    }
  }, [contactsCollection.fetchList])

  function openSend() {
    setSelectedTemplate('')
    setSelectedContacts([])
    setSendError(null)
    setSendSuccess(null)
    loadContacts()
    setSendOpen(true)
  }

  async function handleSendCampaign() {
    if (!selectedTemplate) { setSendError(t('email.selectTemplate')); return }
    if (selectedContacts.length === 0) { setSendError(t('email.selectContacts')); return }
    setSendLoading(true)
    setSendError(null)
    setSendSuccess(null)
    try {
      const res: any = await pb.send('/api/crm/send-campaign', {
        method: 'POST',
        body: JSON.stringify({ template_id: selectedTemplate, contact_ids: selectedContacts }),
        headers: { 'Content-Type': 'application/json' },
      })
      setSendSuccess(t('email.campaignSent', { sent: res.sent, failed: res.failed, id: res.campaign_id }))
      fetchLogs()
    } catch (err: any) {
      setSendError(err?.message || t('email.sendFailed'))
    } finally {
      setSendLoading(false)
    }
  }

  function toggleContact(id: string) {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const templateOptions = templates.map((t: EmailTemplate) => ({ value: t.id, label: t.name }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{t('email.campaignsHint')}</p>
        <Button icon={<Send className="h-4 w-4" />} onClick={openSend}>
          {t('email.newCampaign')}
        </Button>
      </div>

      {campaigns.length === 0 && !logsLoading && (
        <div className="text-center py-12 text-surface-400">
          <Send className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t('empty.campaigns')}</p>
        </div>
      )}

      {logsLoading && (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      )}

      <div className="space-y-2">
        {campaigns.map((campaign) => (
          <div key={campaign.campaign_id} className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 bg-surface-0 hover:bg-surface-50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-surface-900 text-sm truncate">{campaign.template_name}</div>
              <div className="text-xs text-surface-400 mt-0.5 font-mono">{t('email.campaignId')}: {campaign.campaign_id.slice(0, 12)}…</div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-surface-500">{campaign.total} {t('email.recipients')}</span>
              <Badge variant="success">{campaign.sent} {t('email.sent')}</Badge>
              {campaign.failed > 0 && <Badge variant="danger">{campaign.failed} {t('email.failed')}</Badge>}
              <span className="text-surface-400 text-xs hidden sm:block">{fmt(campaign.last_sent)}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-surface-400 shrink-0" />
          </div>
        ))}
      </div>

      {/* Send Campaign Modal */}
      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title={t('email.newCampaign')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSendOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSendCampaign} loading={sendLoading} icon={<Send className="h-4 w-4" />}>
              {t('email.sendCampaign')} ({selectedContacts.length})
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {sendError && <Alert type="error">{sendError}</Alert>}
          {sendSuccess && <Alert type="success">{sendSuccess}</Alert>}

          <Select
            label={t('entities.emailTemplate')}
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            options={[{ value: '', label: `— ${t('email.selectTemplate')} —` }, ...templateOptions]}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">
                {t('entities.contacts')}
                {selectedContacts.length > 0 && (
                  <span className="ml-2 text-xs text-primary-600 font-normal">{t('common.nSelected', { count: selectedContacts.length })}</span>
                )}
              </label>
              <div className="flex gap-2">
                <button className="text-xs text-primary-600 hover:underline" onClick={() => setSelectedContacts(contacts.map((c) => c.id))}>{t('common.all')}</button>
                <span className="text-surface-300">|</span>
                <button className="text-xs text-surface-500 hover:underline" onClick={() => setSelectedContacts([])}>{t('common.none')}</button>
              </div>
            </div>

            {loadingContacts ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              </div>
            ) : (
              <div className="border border-surface-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-surface-100">
                {contacts.length === 0 && (
                  <p className="py-4 text-center text-sm text-surface-400">{t('empty.contacts')}</p>
                )}
                {contacts.map((contact) => {
                  const checked = selectedContacts.includes(contact.id)
                  return (
                    <label key={contact.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-50 transition-colors ${checked ? 'bg-primary-50/50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleContact(contact.id)}
                        className="h-4 w-4 rounded accent-primary-600 shrink-0"
                      />
                      <Users className="h-4 w-4 text-surface-400 shrink-0" />
                      <span className="text-sm font-medium text-surface-800 min-w-0 truncate">
                        {contact.first_name} {contact.last_name}
                      </span>
                      <span className="text-xs text-surface-400 ml-auto shrink-0 hidden sm:block">{contact.email}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
