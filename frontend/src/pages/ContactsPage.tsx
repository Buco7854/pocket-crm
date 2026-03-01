import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Send } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { useCollection } from '@/hooks/useCollection'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { useAuthStore } from '@/store/authStore'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import SearchFilter, { type FilterOption } from '@/components/ui/SearchFilter'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Select from '@/components/ui/Select'
import ContactList from '@/components/contacts/ContactList'
import ContactForm from '@/components/contacts/ContactForm'
import ContactDetail from '@/components/contacts/ContactDetail'
import pb from '@/lib/pocketbase'
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
    if (!selected || !selectedTemplate) { setSendError(t('email.selectTemplate')); return }
    setSendLoading(true)
    setSendError(null)
    setSendSuccess(null)
    try {
      await pb.send('/api/crm/send-email', {
        method: 'POST',
        body: JSON.stringify({ template_id: selectedTemplate, contact_id: selected.id }),
        headers: { 'Content-Type': 'application/json' },
      })
      setSendSuccess(t('email.sentSuccess'))
    } catch (err: any) {
      setSendError(err?.message || t('email.sendFailed'))
    } finally {
      setSendLoading(false)
    }
  }

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
      sort: sortBy,
      sortDir,
    })
  }, [fetchContacts, page, debouncedSearch, filterValues.tag, filterValues.company, sortBy, sortDir])

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

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.first_name} ${selected.last_name}` : ''}
        size="lg"
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
              {selected?.email && (
                <Button variant="secondary" icon={<Send className="h-4 w-4" strokeWidth={1.75} />} onClick={openEmailModal}>
                  {t('email.sendEmail')}
                </Button>
              )}
              {selected && (isAdmin || selected.owner === user?.id) && (
                <Button icon={<Pencil className="h-4 w-4" strokeWidth={1.75} />} onClick={openEdit}>
                  {t('common.edit')}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selected && <ContactDetail contact={selected} />}
      </Modal>

      {/* Send Email Modal */}
      <Modal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title={t('email.sendEmail')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEmailOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSendEmail} loading={sendLoading} icon={<Send className="h-4 w-4" />} disabled={!!sendSuccess}>
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
            <span>{selected?.first_name} {selected?.last_name}</span>
            {selected?.email && <span className="text-surface-400 ml-1">&lt;{selected.email}&gt;</span>}
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
