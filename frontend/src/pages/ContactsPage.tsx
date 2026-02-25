import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
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
import ContactList from '@/components/contacts/ContactList'
import ContactForm from '@/components/contacts/ContactForm'
import ContactDetail from '@/components/contacts/ContactDetail'
import type { Contact, ContactTag, Company } from '@/types/models'
import type { SelectOption } from '@/components/ui/Select'

const tags: ContactTag[] = ['prospect', 'client', 'partenaire', 'fournisseur']

export default function ContactsPage() {
  const { t } = useTranslation()
  const { isAdmin, isCommercial, user } = useAuthStore()
  const { items, totalItems, totalPages, currentPage, loading, error, fetchContacts, create, update, remove } = useContacts()
  const companiesCollection = useCollection<Company>('companies')

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({})
  const [sortBy, setSortBy] = useState('last_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([])

  const deleteConfirm = useDeleteConfirm()
  const debouncedSearch = useDebounce(search, 300)

  const canCreate = isAdmin || isCommercial

  useEffect(() => {
    companiesCollection.fetchList({ perPage: 200, sort: 'name', fields: 'id,name' }).then((res) => {
      if (res) setCompanyOptions(res.items.map((c) => ({ value: c.id, label: c.name })))
    })
  }, [])

  const load = useCallback(() => {
    const tagFilter = (filterValues.tag as string[] | undefined)?.filter(Boolean)
    fetchContacts({
      page,
      search: debouncedSearch,
      tagFilter: tagFilter?.length ? tagFilter : undefined,
      companyFilter: (filterValues.company as string) || undefined,
    })
  }, [fetchContacts, page, debouncedSearch, filterValues.tag, filterValues.company])

  useEffect(() => { load() }, [load])

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('asc') }
  }

  async function handleSubmit(data: Partial<Contact>) {
    setFormLoading(true)
    try {
      if (editing) {
        await update(editing.id, data)
      } else {
        await create({ ...data, owner: user?.id } as Partial<Contact>)
      }
      setFormOpen(false)
      setEditing(null)
      load()
    } finally {
      setFormLoading(false)
    }
  }

  function openCreate() { setEditing(null); setFormOpen(true) }
  function openEdit() { setEditing(selected); setSelected(null); setFormOpen(true) }
  function openDelete() { if (selected) { deleteConfirm.requestDelete(selected.id, `${selected.first_name} ${selected.last_name}`); setSelected(null) } }

  async function handleDelete(id: string) {
    await remove(id)
    load()
  }

  const filters: FilterOption[] = [
    { key: 'company', labelKey: 'fields.company', options: companyOptions },
    { key: 'tag', labelKey: 'fields.tags', options: tags.map((tag) => ({ value: tag, label: t(`contactTag.${tag}`) })), multiple: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.contacts')}</h1>
        {canCreate && (
          <Button icon={<Plus className="h-4 w-4" strokeWidth={2} />} onClick={openCreate}>
            {t('common.addEntity', { entity: t('entities.contact') })}
          </Button>
        )}
      </div>

      {error && <Alert type="error" dismissible>{error}</Alert>}

      <SearchFilter
        searchQuery={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => { setFilterValues((f) => ({ ...f, [k]: v })); setPage(1) }}
      />

      <ContactList
        contacts={items}
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
        title={editing ? t('common.editEntity', { entity: t('entities.contact') }) : t('common.addEntity', { entity: t('entities.contact') })}
        size="lg"
      >
        <ContactForm
          contact={editing}
          companies={companyOptions}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.first_name} ${selected.last_name}` : ''} size="lg">
        {selected && (
          <ContactDetail
            contact={selected}
            onEdit={openEdit}
            onDelete={openDelete}
            canEdit={isAdmin || selected.owner === user?.id}
            canDelete={isAdmin}
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
