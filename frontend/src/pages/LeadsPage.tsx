import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { useCollection } from '@/hooks/useCollection'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { useAuthStore } from '@/store/authStore'
import SearchFilter, { type FilterOption } from '@/components/ui/SearchFilter'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import LeadList from '@/components/leads/LeadList'
import LeadForm from '@/components/leads/LeadForm'
import LeadDetail from '@/components/leads/LeadDetail'
import type { Lead, LeadStatus, LeadSource, Priority, Contact, Company } from '@/types/models'
import type { SelectOption } from '@/components/ui/Select'

const statuses: LeadStatus[] = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu']
const sources: LeadSource[] = ['site_web', 'email', 'telephone', 'salon', 'recommandation', 'autre']
const priorities: Priority[] = ['basse', 'moyenne', 'haute', 'urgente']

export default function LeadsPage() {
  const { t } = useTranslation()
  const { isAdmin, isCommercial, user } = useAuthStore()
  const { items, totalItems, totalPages, currentPage, loading, error, fetchLeads, create, update, remove, updateLeadStatus } = useLeads()
  const contactsCollection = useCollection<Contact>('contacts')
  const companiesCollection = useCollection<Company>('companies')

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)

  const [contactOptions, setContactOptions] = useState<SelectOption[]>([])
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([])

  const deleteConfirm = useDeleteConfirm()
  const debouncedSearch = useDebounce(search, 300)

  const canCreate = isAdmin || isCommercial

  useEffect(() => {
    contactsCollection.fetchList({ perPage: 200, sort: 'last_name', fields: 'id,first_name,last_name' }).then((r) => {
      if (r) setContactOptions(r.items.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })))
    })
    companiesCollection.fetchList({ perPage: 200, sort: 'name', fields: 'id,name' }).then((r) => {
      if (r) setCompanyOptions(r.items.map((c) => ({ value: c.id, label: c.name })))
    })
  }, [])

  const load = useCallback(() => {
    fetchLeads({ page, search: debouncedSearch, statusFilter: filterValues.status || undefined, priorityFilter: filterValues.priority || undefined, sourceFilter: filterValues.source || undefined })
  }, [fetchLeads, page, debouncedSearch, filterValues.status, filterValues.priority, filterValues.source])

  useEffect(() => { load() }, [load])

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('asc') }
  }

  async function handleSubmit(data: Partial<Lead>) {
    setFormLoading(true)
    try {
      if (editing) await update(editing.id, data)
      else await create(data)
      setFormOpen(false); setEditing(null); load()
    } finally { setFormLoading(false) }
  }

  async function handleStatusChange(status: LeadStatus) {
    if (!selected) return
    await updateLeadStatus(selected.id, status)
    setSelected(null); load()
  }

  function openCreate() { setEditing(null); setFormOpen(true) }
  function openEdit() { setEditing(selected); setSelected(null); setFormOpen(true) }
  function openDelete() { if (selected) { deleteConfirm.requestDelete(selected.id, selected.title); setSelected(null) } }

  async function handleDelete(id: string) { await remove(id); load() }

  const filters: FilterOption[] = [
    { key: 'status', labelKey: 'fields.status', options: statuses.map((v) => ({ value: v, label: t(`status.${v}`) })) },
    { key: 'priority', labelKey: 'fields.priority', options: priorities.map((v) => ({ value: v, label: t(`priority.${v}`) })) },
    { key: 'source', labelKey: 'fields.source', options: sources.map((v) => ({ value: v, label: t(`leadSource.${v}`) })) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.leads')}</h1>
        {canCreate && (
          <Button icon={<Plus className="h-4 w-4" strokeWidth={2} />} onClick={openCreate}>
            {t('common.addEntity', { entity: t('entities.lead') })}
          </Button>
        )}
      </div>

      {error && <Alert type="error" dismissible>{error}</Alert>}

      <SearchFilter
        searchQuery={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => { setFilterValues((f) => ({ ...f, [k]: v as string })); setPage(1) }}
      />

      <LeadList leads={items} loading={loading} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} onRowClick={setSelected} />

      {totalPages > 1 && (
        <Pagination page={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? t('common.editEntity', { entity: t('entities.lead') }) : t('common.addEntity', { entity: t('entities.lead') })}
        size="lg"
      >
        <LeadForm lead={editing} contacts={contactOptions} companies={companyOptions} loading={formLoading} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditing(null) }} />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} size="lg">
        {selected && (
          <LeadDetail
            lead={selected}
            onEdit={openEdit}
            onDelete={openDelete}
            onStatusChange={handleStatusChange}
            canEdit={isAdmin || selected.owner === user?.id}
            canDelete={isAdmin}
          />
        )}
      </Modal>

      <ConfirmDialog open={deleteConfirm.isOpen} name={deleteConfirm.itemLabel} loading={deleteConfirm.loading} onConfirm={() => deleteConfirm.confirmDelete(handleDelete)} onCancel={deleteConfirm.cancelDelete} />
    </div>
  )
}
