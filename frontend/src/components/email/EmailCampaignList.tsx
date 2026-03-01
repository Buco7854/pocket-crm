import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Clock } from 'lucide-react'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import { useCollection } from '@/hooks/useCollection'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { useDebounce } from '@/hooks/useDebounce'
import pb from '@/lib/pocketbase'
import SearchFilter, { type FilterOption } from '@/components/ui/SearchFilter'
import Pagination from '@/components/ui/Pagination'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Table, { type TableColumn } from '@/components/ui/Table'
import CampaignDetail from '@/components/email/CampaignDetail'
import type { EmailTemplate, Contact, Campaign, CampaignStatus } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'

const statusVariant: Record<CampaignStatus, BadgeVariant> = {
  brouillon: 'default',
  programmee: 'warning',
  en_cours: 'info',
  envoye: 'success',
  termine: 'default',
}

/** Convert a PocketBase/ISO date string to the value expected by datetime-local inputs */
function toDatetimeLocal(isoStr: string | undefined): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props {
  createTrigger?: number
}

export default function EmailCampaignList({ createTrigger }: Props) {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const { items: templates, fetchTemplates } = useEmailTemplates()
  const campaignsCollection = useCollection<Campaign>('campaigns')
  const contactsCollection = useCollection<Contact>('contacts')
  const deleteConfirm = useDeleteConfirm()

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const [selected, setSelected] = useState<Campaign | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contactOptions, setContactOptions] = useState<{ value: string; label: string }[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : '—'

  const loadCampaigns = useCallback(() => {
    const filters: string[] = ['type = "email"']
    if (debouncedSearch) {
      const s = debouncedSearch.replace(/"/g, '\\"')
      filters.push(`name ~ "${s}"`)
    }
    if (filterValues.status) {
      filters.push(`status = "${filterValues.status}"`)
    }
    campaignsCollection.fetchList({
      page,
      sort: '-created',
      expand: 'template',
      filter: filters.join(' && '),
    })
  }, [campaignsCollection.fetchList, page, debouncedSearch, filterValues.status])

  useEffect(() => { fetchTemplates() }, [])
  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true)
    try {
      const res = await contactsCollection.fetchList({ perPage: 500, sort: 'last_name', fields: 'id,first_name,last_name,email' })
      if (res) {
        setContactOptions(
          res.items
            .filter((c) => c.email)
            .map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name} — ${c.email}` }))
        )
      }
    } finally {
      setLoadingContacts(false)
    }
  }, [contactsCollection.fetchList])

  function openCreate() {
    setEditingCampaign(null)
    setName('')
    setSelectedTemplate('')
    setSelectedContacts([])
    setScheduledAt('')
    setError(null)
    loadContacts()
    setModalOpen(true)
  }

  useEffect(() => {
    if (createTrigger) openCreate()
  }, [createTrigger]) // eslint-disable-line react-hooks/exhaustive-deps


  function openEdit(campaign: Campaign) {
    setEditingCampaign(campaign)
    setName(campaign.name)
    setSelectedTemplate(campaign.template || '')
    setSelectedContacts(campaign.contact_ids || [])
    setScheduledAt(toDatetimeLocal(campaign.scheduled_at))
    setError(null)
    loadContacts()
    setSelected(null)
    setModalOpen(true)
  }

  function openDelete(campaign: Campaign) {
    deleteConfirm.requestDelete(campaign.id, campaign.name)
    setSelected(null)
  }

  async function handleSave() {
    if (!name.trim()) { setError(t('validation.required')); return }
    if (!selectedTemplate) { setError(t('email.selectTemplate')); return }
    setSaving(true)
    setError(null)
    try {
      const scheduledAtISO = scheduledAt ? new Date(scheduledAt).toISOString() : null
      const newStatus: CampaignStatus = scheduledAt ? 'programmee' : 'brouillon'
      if (editingCampaign) {
        await pb.collection('campaigns').update(editingCampaign.id, {
          name,
          template: selectedTemplate,
          contact_ids: selectedContacts,
          total: selectedContacts.length,
          scheduled_at: scheduledAtISO,
          status: newStatus,
        })
      } else {
        await pb.collection('campaigns').create({
          name,
          type: 'email',
          template: selectedTemplate,
          contact_ids: selectedContacts,
          status: newStatus,
          total: selectedContacts.length,
          sent: 0,
          failed: 0,
          created_by: user?.id,
          scheduled_at: scheduledAtISO,
        })
      }
      setModalOpen(false)
      setEditingCampaign(null)
      loadCampaigns()
    } catch (err: any) {
      setError(err?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleUnschedule(campaign: Campaign) {
    try {
      await pb.collection('campaigns').update(campaign.id, {
        status: 'brouillon',
        scheduled_at: null,
      })
      setSelected(null)
      loadCampaigns()
    } catch (err: any) {
      setError(err?.message || t('common.error'))
    }
  }

  async function handleDelete(id: string) {
    await pb.collection('campaigns').delete(id)
    loadCampaigns()
  }

  async function handleSendCampaign(campaign: Campaign) {
    setSending(campaign.id)
    setSelected(null)
    setError(null)
    try {
      await pb.send(`/api/crm/campaigns/${campaign.id}/send`, { method: 'POST' })
      loadCampaigns()
    } catch (err: any) {
      setError(err?.message || t('email.sendFailed2'))
    } finally {
      setSending(null)
    }
  }

  const templateOptions = templates.map((tpl: EmailTemplate) => ({ value: tpl.id, label: tpl.name }))

  const statuses: CampaignStatus[] = ['brouillon', 'programmee', 'en_cours', 'envoye']

  const filters: FilterOption[] = [
    {
      key: 'status',
      labelKey: 'fields.status',
      options: statuses.map((s) => ({ value: s, label: t(`campaignStatus.${s}`) })),
    },
  ]

  const columns: TableColumn<Campaign>[] = [
    {
      key: 'name', labelKey: 'fields.name', sortable: true,
      render: (v, row) => (
        <div>
          <span className="font-medium">{v as string}</span>
          {row.scheduled_at && row.status === 'programmee' && (
            <p className="text-xs text-warning-600 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {fmt(row.scheduled_at)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'template', labelKey: 'entities.emailTemplate',
      render: (_v, row) => <span className="text-surface-600">{(row as any).expand?.template?.name || '—'}</span>,
    },
    {
      key: 'status', labelKey: 'fields.status',
      render: (v) => <Badge variant={statusVariant[v as CampaignStatus]}>{t(`campaignStatus.${v}`)}</Badge>,
    },
    {
      key: 'total', labelKey: 'email.recipients', align: 'right',
      render: (_v, row) => (
        <span className="text-sm text-surface-600">
          {row.status === 'envoye' ? `${row.sent}/${row.total}` : row.total}
          {row.failed > 0 && <> <Badge variant="danger">{row.failed}</Badge></>}
        </span>
      ),
    },
    {
      key: 'created', labelKey: 'fields.createdAt',
      render: (v) => <span className="text-xs text-surface-500">{fmt(v as string)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      {error && <Alert type="error" dismissible>{error}</Alert>}

      <SearchFilter
        searchQuery={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => { setFilterValues((f) => ({ ...f, [k]: v as string })); setPage(1) }}
      />

      <Table<Campaign>
        columns={columns}
        data={campaignsCollection.items}
        loading={campaignsCollection.loading}
        onRowClick={setSelected}
      />

      {campaignsCollection.totalPages > 1 && (
        <Pagination
          page={campaignsCollection.currentPage}
          totalPages={campaignsCollection.totalPages}
          totalItems={campaignsCollection.totalItems}
          onPageChange={setPage}
        />
      )}

      {campaignsCollection.items.length === 0 && !campaignsCollection.loading && (
        <div className="text-center py-12 text-surface-400">
          <Send className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t('empty.campaigns')}</p>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        size="md"
      >
        {selected && (
          <CampaignDetail
            campaign={selected}
            sending={sending === selected.id}
            onEdit={() => openEdit(selected)}
            onDelete={() => openDelete(selected)}
            onSend={() => handleSendCampaign(selected)}
            onUnschedule={() => handleUnschedule(selected)}
          />
        )}
      </Modal>

      {/* New / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCampaign ? t('common.editEntity', { entity: editingCampaign.name }) : t('email.newCampaign')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} loading={saving} disabled={!selectedTemplate}>
              {editingCampaign
                ? t('common.save')
                : scheduledAt
                  ? t('campaigns.schedule')
                  : t('email.saveDraft')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <Input
            label={t('email.campaignName')}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select
            label={t('entities.emailTemplate')}
            required
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            options={templateOptions}
            placeholder={t('email.selectTemplate')}
            searchable
          />

          {loadingContacts ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : (
            <Select
              label={`${t('email.campaignContacts')}${selectedContacts.length > 0 ? ` (${selectedContacts.length})` : ''}`}
              multiple
              values={selectedContacts}
              onChangeMultiple={setSelectedContacts}
              options={contactOptions}
              placeholder={t('email.noContacts')}
              searchable
            />
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              {t('campaigns.scheduleAt')}
              <span className="text-surface-400 font-normal ml-1">({t('common.optional') ?? 'optionnel'})</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {scheduledAt && (
              <p className="mt-1 text-xs text-warning-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('campaigns.scheduledFor', { date: fmt(new Date(scheduledAt).toISOString()) })}
              </p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.isOpen}
        name={deleteConfirm.itemLabel}
        loading={deleteConfirm.loading}
        onConfirm={() => deleteConfirm.confirmDelete(handleDelete)}
        onCancel={deleteConfirm.cancelDelete}
      />
    </div>
  )
}
