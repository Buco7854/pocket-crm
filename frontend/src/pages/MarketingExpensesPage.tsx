import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { useMarketingExpenses } from '@/hooks/useMarketingExpenses'
import { useAuthStore } from '@/store/authStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import SearchFilter, { type FilterOption } from '@/components/ui/SearchFilter'
import Pagination from '@/components/ui/Pagination'
import Table, { type TableColumn } from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import MarketingExpenseForm from '@/components/marketing/MarketingExpenseForm'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { MarketingExpense, MarketingExpenseCategory } from '@/types/models'

const CATEGORIES: MarketingExpenseCategory[] = [
  'email', 'site_web', 'salon', 'telephone', 'recommandation', 'autre',
]

const CATEGORY_VARIANT: Record<MarketingExpenseCategory, BadgeVariant> = {
  email: 'info',
  site_web: 'primary',
  salon: 'success',
  telephone: 'warning',
  recommandation: 'default',
  autre: 'default',
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k€`
  return `${n.toFixed(0)}€`
}

export default function MarketingExpensesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const expenses = useMarketingExpenses()
  const deleteConfirm = useDeleteConfirm()

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MarketingExpense | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selected, setSelected] = useState<MarketingExpense | null>(null)

  const load = useCallback(() => {
    expenses.fetchExpenses({
      page,
      search: debouncedSearch,
      categoryFilter: filterValues.category,
    })
  }, [expenses.fetchExpenses, page, debouncedSearch, filterValues.category])

  useEffect(() => { load() }, [load])

  async function handleSubmit(data: Partial<MarketingExpense>) {
    setFormLoading(true)
    try {
      const payload = { ...data, created_by: editing ? editing.created_by : user?.id }
      if (editing) {
        await expenses.update(editing.id, payload)
      } else {
        await expenses.create(payload)
      }
      setFormOpen(false)
      setEditing(null)
      load()
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await expenses.remove(id)
    load()
  }

  const isAdmin = user?.role === 'admin'

  const filters: FilterOption[] = [
    {
      key: 'category',
      labelKey: 'marketingExpenses.category',
      options: CATEGORIES.map((c) => ({ value: c, label: t(`leadSource.${c}`) })),
    },
  ]

  const columns: TableColumn<MarketingExpense>[] = [
    {
      key: 'date', labelKey: 'marketingExpenses.date',
      render: (v) => <span className="tabular-nums text-surface-700">{(v as string)?.slice(0, 10) || '—'}</span>,
    },
    {
      key: 'category', labelKey: 'marketingExpenses.category',
      render: (v) => (
        <Badge variant={CATEGORY_VARIANT[v as MarketingExpenseCategory]}>
          {t(`leadSource.${v}`)}
        </Badge>
      ),
    },
    {
      key: 'description', labelKey: 'marketingExpenses.description',
      render: (v) => v
        ? <span className="text-surface-600 max-w-xs truncate block">{v as string}</span>
        : <span className="text-surface-400 italic">{t('common.none')}</span>,
    },
    {
      key: 'amount', labelKey: 'marketingExpenses.amount', align: 'right',
      render: (v) => <span className="font-semibold tabular-nums">{fmtMoney(v as number)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-surface-900">{t('marketingExpenses.title')}</h1>
        <Button icon={<Plus className="h-4 w-4" strokeWidth={2} />} onClick={() => { setEditing(null); setFormOpen(true) }}>
          {t('marketingExpenses.addExpense')}
        </Button>
      </div>

      {expenses.error && <Alert type="error" dismissible>{expenses.error}</Alert>}

      <SearchFilter
        searchQuery={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => { setFilterValues((f) => ({ ...f, [k]: v as string })); setPage(1) }}
      />

      <Table<MarketingExpense>
        columns={columns}
        data={expenses.items}
        loading={expenses.loading}
        onRowClick={(row) => setSelected(row)}
      />

      {expenses.totalPages > 1 && (
        <Pagination
          page={expenses.currentPage}
          totalPages={expenses.totalPages}
          totalItems={expenses.totalItems}
          onPageChange={setPage}
        />
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${fmtMoney(selected.amount)} — ${t(`leadSource.${selected.category}`)}` : ''}
        footer={
          <div className="flex justify-between w-full">
            <div>
              {isAdmin && selected && (
                <Button
                  variant="danger"
                  icon={<Trash2 className="h-4 w-4" strokeWidth={1.75} />}
                  onClick={() => {
                    deleteConfirm.requestDelete(selected.id, `${fmtMoney(selected.amount)} — ${t(`leadSource.${selected.category}`)}`)
                    setSelected(null)
                  }}
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
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-surface-400" strokeWidth={1.75} />
                <span className="text-surface-900 tabular-nums">{selected.date?.slice(0, 10) || '—'}</span>
              </div>
              <div>
                <Badge variant={CATEGORY_VARIANT[selected.category]}>{t(`leadSource.${selected.category}`)}</Badge>
              </div>
              <div className="sm:col-span-2">
                <span className="text-surface-500">{t('marketingExpenses.amount')}:</span>
                <span className="ml-2 font-semibold tabular-nums text-surface-900">{fmtMoney(selected.amount)}</span>
              </div>
              {selected.description && (
                <div className="sm:col-span-2">
                  <span className="text-surface-500">{t('marketingExpenses.description')}:</span>
                  <p className="mt-1 text-surface-700">{selected.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? t('marketingExpenses.editExpense') : t('marketingExpenses.addExpense')}
      >
        <MarketingExpenseForm
          expense={editing}
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
