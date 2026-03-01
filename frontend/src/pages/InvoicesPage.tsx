import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react'
import { useInvoices } from '@/hooks/useInvoices'
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
import InvoiceList from '@/components/invoices/InvoiceList'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import InvoiceDetail from '@/components/invoices/InvoiceDetail'
import type { Invoice, InvoiceStatus, Contact, Company, Lead } from '@/types/models'
import type { SelectOption } from '@/components/ui/Select'

const statuses: InvoiceStatus[] = ['brouillon', 'emise', 'payee', 'en_retard', 'annulee']

export default function InvoicesPage() {
  const { t } = useTranslation()
  const { isAdmin, isCommercial, user } = useAuthStore()
  const { items, totalItems, totalPages, currentPage, loading, error, fetchInvoices, create, update, remove, markPaid } = useInvoices()
  const contactsCollection = useCollection<Contact>('contacts')
  const companiesCollection = useCollection<Company>('companies')
  const leadsCollection = useCollection<Lead>('leads')

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('issued_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)

  const [contactOptions, setContactOptions] = useState<SelectOption[]>([])
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([])
  const [leadOptions, setLeadOptions] = useState<SelectOption[]>([])

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
    leadsCollection.fetchList({ perPage: 200, sort: 'title', fields: 'id,title' }).then((r) => {
      if (r) setLeadOptions(r.items.map((l) => ({ value: l.id, label: l.title })))
    })
  }, [])

  const load = useCallback(() => {
    fetchInvoices({ page, search: debouncedSearch, statusFilter: filterValues.status || undefined, sort: sortBy, sortDir })
  }, [fetchInvoices, page, debouncedSearch, filterValues.status, sortBy, sortDir])

  useEffect(() => { load() }, [load])

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('desc') }
  }

  async function handleSubmit(data: Partial<Invoice>) {
    setFormLoading(true)
    try {
      if (editing) await update(editing.id, data)
      else await create(data)
      setFormOpen(false)
      setEditing(null)
      load()
    } finally {
      setFormLoading(false)
    }
  }

  async function handleMarkPaid() {
    if (!selected) return
    await markPaid(selected.id)
    setSelected(null)
    load()
  }

  async function handleStatusChange(status: InvoiceStatus) {
    if (!selected) return
    await update(selected.id, { status } as Partial<Invoice>)
    setSelected(null)
    load()
  }

  function openCreate() { setEditing(null); setFormOpen(true) }
  function openEdit() { setEditing(selected); setSelected(null); setFormOpen(true) }
  function openDelete() { if (selected) { deleteConfirm.requestDelete(selected.id, selected.number); setSelected(null) } }

  async function handleDelete(id: string) { await remove(id); load() }

  const canEdit = (invoice: Invoice) => isAdmin || invoice.owner === user?.id

  const filters: FilterOption[] = [
    { key: 'status', labelKey: 'fields.status', options: statuses.map((v) => ({ value: v, label: t(`invoiceStatus.${v}`) })) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.invoices')}</h1>
        {canCreate && (
          <Button icon={<Plus className="h-4 w-4" strokeWidth={2} />} onClick={openCreate}>
            {t('common.addEntity', { entity: t('entities.invoice') })}
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

      <InvoiceList
        invoices={items}
        loading={loading}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={setSelected}
      />

      {totalPages > 1 && (
        <Pagination page={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? t('common.editEntity', { entity: t('entities.invoice') }) : t('common.addEntity', { entity: t('entities.invoice') })}
        size="xl"
      >
        <InvoiceForm
          invoice={editing}
          contacts={contactOptions}
          companies={companyOptions}
          leads={leadOptions}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.number}
        size="xl"
        footer={
          <div className="flex justify-between w-full">
            <div>
              {isAdmin && selected && (
                <Button variant="danger" icon={<Trash2 className="h-4 w-4" strokeWidth={1.75} />} onClick={openDelete}>
                  {t('common.delete')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selected && canEdit(selected) && selected.status !== 'payee' && (
                <Button variant="primary" icon={<CheckCircle className="h-4 w-4" strokeWidth={1.75} />} onClick={handleMarkPaid}>
                  {t('invoices.markPaid', { defaultValue: 'Marquer payée' })}
                </Button>
              )}
              {selected && canEdit(selected) && (
                <Button variant="secondary" icon={<Pencil className="h-4 w-4" strokeWidth={1.75} />} onClick={openEdit}>
                  {t('common.edit')}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selected && (
          <InvoiceDetail
            invoice={selected}
            onStatusChange={handleStatusChange}
            canEdit={canEdit(selected)}
          />
        )}
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
