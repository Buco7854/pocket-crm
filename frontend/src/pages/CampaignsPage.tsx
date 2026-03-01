import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Megaphone, Plus, Pencil, Trash2 } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { useAuthStore } from '@/store/authStore'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { useDebounce } from '@/hooks/useDebounce'
import SearchFilter from '@/components/ui/SearchFilter'
import Pagination from '@/components/ui/Pagination'
import Table, { type TableColumn } from '@/components/ui/Table'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import EmailCampaignList from '@/components/email/EmailCampaignList'
import MarketingCampaignForm from '@/components/marketing/MarketingCampaignForm'
import type { Campaign, CampaignType, CampaignStatus } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'
import pb from '@/lib/pocketbase'

type CampaignTab = 'email' | 'other'

const CAMPAIGN_TYPE_VARIANT: Record<CampaignType, BadgeVariant> = {
  email: 'info',
  ads: 'primary',
  social: 'success',
  event: 'warning',
  seo: 'default',
  autre: 'default',
}

const CAMPAIGN_STATUS_VARIANT: Record<CampaignStatus, BadgeVariant> = {
  brouillon: 'default',
  en_cours: 'info',
  envoye: 'success',
  termine: 'default',
}

export default function CampaignsPage() {
  const { t, i18n } = useTranslation()
  const { tab = 'email' } = useParams<{ tab: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const campaignsCollection = useCollection<Campaign>('campaigns')
  const deleteConfirm = useDeleteConfirm()

  const activeTab = tab as CampaignTab

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Campaign | null>(null)

  const fmt = (d: string) =>
    d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'

  const loadCampaigns = useCallback(() => {
    const filters: string[] = ['type != "email"']
    if (debouncedSearch) {
      const s = debouncedSearch.replace(/"/g, '\\"')
      filters.push(`name ~ "${s}"`)
    }
    campaignsCollection.fetchList({ page, sort: '-created', filter: filters.join(' && ') })
  }, [campaignsCollection.fetchList, page, debouncedSearch])

  useEffect(() => {
    if (activeTab === 'other') loadCampaigns()
  }, [loadCampaigns, activeTab])

  async function handleSubmit(data: Partial<Campaign>) {
    setFormLoading(true)
    setError(null)
    try {
      if (editing) {
        await pb.collection('campaigns').update(editing.id, data)
      } else {
        await pb.collection('campaigns').create({ ...data, created_by: user?.id })
      }
      setFormOpen(false)
      setEditing(null)
      loadCampaigns()
    } catch (err: any) {
      setError(err?.message || t('common.error'))
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await pb.collection('campaigns').delete(id)
    loadCampaigns()
  }

  const isAdmin = user?.role === 'admin'

  const columns: TableColumn<Campaign>[] = [
    {
      key: 'name', labelKey: 'fields.name', sortable: true,
      render: (v) => <span className="font-medium text-surface-900">{v as string}</span>,
    },
    {
      key: 'type', labelKey: 'campaign.type',
      render: (v) => (
        <Badge variant={CAMPAIGN_TYPE_VARIANT[v as CampaignType]}>
          {t(`campaignType.${v}`)}
        </Badge>
      ),
    },
    {
      key: 'status', labelKey: 'fields.status',
      render: (v) => (
        <Badge variant={CAMPAIGN_STATUS_VARIANT[v as CampaignStatus]}>
          {t(`campaignStatus.${v}`)}
        </Badge>
      ),
    },
    {
      key: 'created', labelKey: 'fields.createdAt',
      render: (v) => <span className="text-xs text-surface-500">{fmt(v as string)}</span>,
    },
  ]

  const tabs: TabItem<CampaignTab>[] = [
    { key: 'email', label: t('email.tabs.campaigns') },
    { key: 'other', label: t('campaigns.otherTypes') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Megaphone className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-surface-900">{t('nav.campaigns')}</h1>
            <p className="text-sm text-surface-500">{t('campaigns.description')}</p>
          </div>
        </div>
        {activeTab === 'other' && (
          <Button
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
            onClick={() => { setEditing(null); setFormOpen(true) }}
          >
            {t('campaign.add')}
          </Button>
        )}
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={(key) => navigate(`/campaigns/${key}`)} />

      {/* ── Email campaigns tab ── */}
      {activeTab === 'email' && <EmailCampaignList />}

      {/* ── Other campaigns tab ── */}
      {activeTab === 'other' && (
        <>
          {error && <Alert type="error" dismissible>{error}</Alert>}

          <SearchFilter
            searchQuery={search}
            onSearchChange={(v) => { setSearch(v); setPage(1) }}
            filters={[]}
            filterValues={{}}
            onFilterChange={() => {}}
          />

          <Table<Campaign>
            columns={columns}
            data={campaignsCollection.items}
            loading={campaignsCollection.loading}
            onRowClick={(row) => setSelected(row)}
          />

          {(campaignsCollection.totalPages ?? 0) > 1 && (
            <Pagination
              page={campaignsCollection.currentPage ?? 1}
              totalPages={campaignsCollection.totalPages ?? 1}
              totalItems={campaignsCollection.totalItems ?? 0}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        footer={
          <div className="flex justify-between w-full">
            <div>
              {isAdmin && selected && (
                <Button
                  variant="danger"
                  icon={<Trash2 className="h-4 w-4" strokeWidth={1.75} />}
                  onClick={() => { deleteConfirm.requestDelete(selected.id, selected.name); setSelected(null) }}
                >
                  {t('common.delete')}
                </Button>
              )}
            </div>
            <Button
              icon={<Pencil className="h-4 w-4" strokeWidth={1.75} />}
              onClick={() => { setEditing(selected); setFormOpen(true); setSelected(null) }}
            >
              {t('common.edit')}
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
              <div>
                <span className="text-surface-500">{t('campaign.type')}:</span>
                <span className="ml-1">
                  <Badge variant={CAMPAIGN_TYPE_VARIANT[selected.type]}>{t(`campaignType.${selected.type}`)}</Badge>
                </span>
              </div>
              <div>
                <span className="text-surface-500">{t('fields.status')}:</span>
                <span className="ml-1">
                  <Badge variant={CAMPAIGN_STATUS_VARIANT[selected.status]}>{t(`campaignStatus.${selected.status}`)}</Badge>
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-surface-500">{t('fields.createdAt')}:</span>
                <span className="text-surface-900 ml-1">{fmt(selected.created)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? t('campaign.edit') : t('campaign.add')}
      >
        <MarketingCampaignForm
          campaign={editing}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
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
