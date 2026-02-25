import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { useAuthStore } from '@/store/authStore'
import SearchFilter, { type FilterOption } from '@/components/ui/SearchFilter'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import CompanyList from '@/components/companies/CompanyList'
import CompanyForm from '@/components/companies/CompanyForm'
import CompanyDetail from '@/components/companies/CompanyDetail'
import type { Company, CompanySize } from '@/types/models'

const sizes: CompanySize[] = ['tpe', 'pme', 'eti', 'grande_entreprise']

export default function CompaniesPage() {
  const { t } = useTranslation()
  const { isAdmin, isCommercial, user } = useAuthStore()
  const { items, totalItems, totalPages, currentPage, loading, error, fetchCompanies, create, update, remove } = useCompanies()

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selected, setSelected] = useState<Company | null>(null)

  const deleteConfirm = useDeleteConfirm()
  const debouncedSearch = useDebounce(search, 300)

  const canCreate = isAdmin || isCommercial

  const load = useCallback(() => {
    fetchCompanies({ page, search: debouncedSearch, sizeFilter: filterValues.size || undefined })
  }, [fetchCompanies, page, debouncedSearch, filterValues.size])

  useEffect(() => { load() }, [load])

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('asc') }
  }

  async function handleSubmit(data: Partial<Company>) {
    setFormLoading(true)
    try {
      if (editing) {
        await update(editing.id, data)
      } else {
        await create({ ...data, owner: user?.id } as Partial<Company>)
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
  function openDelete() { if (selected) { deleteConfirm.requestDelete(selected.id, selected.name); setSelected(null) } }

  async function handleDelete(id: string) {
    await remove(id)
    load()
  }

  const filters: FilterOption[] = [
    { key: 'size', labelKey: 'fields.size', options: sizes.map((s) => ({ value: s, label: t(`companySize.${s}`) })) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.companies')}</h1>
        {canCreate && (
          <Button icon={<Plus className="h-4 w-4" strokeWidth={2} />} onClick={openCreate}>
            {t('common.addEntity', { entity: t('entities.company') })}
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

      <CompanyList
        companies={items}
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
        title={editing ? t('common.editEntity', { entity: t('entities.company') }) : t('common.addEntity', { entity: t('entities.company') })}
        size="lg"
      >
        <CompanyForm
          company={editing}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        size="lg"
      >
        {selected && (
          <CompanyDetail
            company={selected}
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
