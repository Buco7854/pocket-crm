import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, List, CalendarDays, Bell } from 'lucide-react'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import { useTasks } from '@/hooks/useTasks'
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
import TaskList from '@/components/tasks/TaskList'
import TaskForm from '@/components/tasks/TaskForm'
import TaskDetail from '@/components/tasks/TaskDetail'
import TaskCalendar from '@/components/tasks/TaskCalendar'
import TaskReminder from '@/components/tasks/TaskReminder'
import type { Task, TaskStatus, TaskType, Priority, User, Contact, Company } from '@/types/models'
import type { SelectOption } from '@/components/ui/Select'

const statuses: TaskStatus[] = ['a_faire', 'en_cours', 'terminee', 'annulee']
const types: TaskType[] = ['appel', 'email', 'reunion', 'suivi', 'autre']
const priorities: Priority[] = ['basse', 'moyenne', 'haute', 'urgente']

type TabKey = 'list' | 'calendar' | 'reminders'

export default function TasksPage() {
  const { t } = useTranslation()
  const { isAdmin, user } = useAuthStore()
  const { items, totalItems, totalPages, currentPage, loading, error, fetchTasks, create, update, remove } = useTasks()
  const allTasksCollection = useCollection<Task>('tasks')
  const usersCollection = useCollection<User>('users')
  const contactsCollection = useCollection<Contact>('contacts')
  const companiesCollection = useCollection<Company>('companies')

  const [activeTab, setActiveTab] = useState<TabKey>('list')
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('due_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)

  const [userOptions, setUserOptions] = useState<SelectOption[]>([])
  const [contactOptions, setContactOptions] = useState<SelectOption[]>([])
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([])

  const deleteConfirm = useDeleteConfirm()
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    usersCollection.fetchList({ perPage: 200, sort: 'name', fields: 'id,name' }).then((r) => {
      if (r) setUserOptions(r.items.map((u) => ({ value: u.id, label: u.name })))
    })
    contactsCollection.fetchList({ perPage: 200, sort: 'last_name', fields: 'id,first_name,last_name' }).then((r) => {
      if (r) setContactOptions(r.items.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })))
    })
    companiesCollection.fetchList({ perPage: 200, sort: 'name', fields: 'id,name' }).then((r) => {
      if (r) setCompanyOptions(r.items.map((c) => ({ value: c.id, label: c.name })))
    })
  }, [])

  const load = useCallback(() => {
    fetchTasks({ page, search: debouncedSearch, statusFilter: filterValues.status || undefined, priorityFilter: filterValues.priority || undefined, typeFilter: filterValues.type || undefined })
  }, [fetchTasks, page, debouncedSearch, filterValues.status, filterValues.priority, filterValues.type])

  useEffect(() => { load() }, [load])

  // Load all tasks (unpaginated) for calendar and reminders views
  const loadAllTasks = useCallback(() => {
    allTasksCollection.fetchList({ perPage: 1000, sort: 'due_date', expand: 'assignee,contact,company' })
  }, [allTasksCollection.fetchList])

  useEffect(() => {
    if (activeTab === 'calendar' || activeTab === 'reminders') loadAllTasks()
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('asc') }
  }

  async function handleSubmit(data: Partial<Task>) {
    setFormLoading(true)
    try {
      if (editing) {
        await update(editing.id, data)
      } else {
        await create(data)
      }
      setFormOpen(false)
      setEditing(null)
      load()
      if (activeTab !== 'list') loadAllTasks()
    } finally {
      setFormLoading(false)
    }
  }

  async function handleToggleComplete() {
    if (!selected) return
    const isDone = selected.status === 'terminee'
    await update(selected.id, {
      status: isDone ? 'a_faire' : 'terminee',
      completed_at: isDone ? '' : new Date().toISOString(),
    } as Partial<Task>)
    setSelected(null)
    load()
    if (activeTab !== 'list') loadAllTasks()
  }

  function openCreate() { setEditing(null); setFormOpen(true) }
  function openEdit() { setEditing(selected); setSelected(null); setFormOpen(true) }
  function openDelete() { if (selected) { deleteConfirm.requestDelete(selected.id, selected.title); setSelected(null) } }

  async function handleDelete(id: string) {
    await remove(id)
    load()
    if (activeTab !== 'list') loadAllTasks()
  }

  const canEdit = (task: Task) => isAdmin || task.assignee === user?.id || task.created_by === user?.id

  const filters: FilterOption[] = [
    { key: 'type', labelKey: 'fields.type', options: types.map((v) => ({ value: v, label: t(`taskType.${v}`) })) },
    { key: 'status', labelKey: 'fields.status', options: statuses.map((v) => ({ value: v, label: t(`taskStatus.${v}`) })) },
    { key: 'priority', labelKey: 'fields.priority', options: priorities.map((v) => ({ value: v, label: t(`priority.${v}`) })) },
  ]

  const tabs: TabItem<TabKey>[] = [
    { key: 'list', label: t('tasks.viewList'), icon: <List className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'calendar', label: t('tasks.viewCalendar'), icon: <CalendarDays className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'reminders', label: t('tasks.viewReminders'), icon: <Bell className="h-4 w-4" strokeWidth={1.75} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.tasks')}</h1>
        <Button icon={<Plus className="h-4 w-4" strokeWidth={2} />} onClick={openCreate}>
          {t('common.addEntity', { entity: t('entities.task') })}
        </Button>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {error && <Alert type="error" dismissible>{error}</Alert>}

      {activeTab === 'list' && (
        <>
          <SearchFilter
            searchQuery={search}
            onSearchChange={(v) => { setSearch(v); setPage(1) }}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={(k, v) => { setFilterValues((f) => ({ ...f, [k]: v as string })); setPage(1) }}
          />

          <TaskList tasks={items} loading={loading} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} onRowClick={setSelected} />

          {totalPages > 1 && (
            <Pagination page={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
          )}
        </>
      )}

      {activeTab === 'calendar' && (
        <TaskCalendar tasks={allTasksCollection.items} onTaskClick={setSelected} />
      )}

      {activeTab === 'reminders' && (
        <TaskReminder tasks={allTasksCollection.items} onTaskClick={setSelected} />
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? t('common.editEntity', { entity: t('entities.task') }) : t('common.addEntity', { entity: t('entities.task') })}
        size="lg"
      >
        <TaskForm
          task={editing}
          users={userOptions}
          contacts={contactOptions}
          companies={companyOptions}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} size="lg">
        {selected && (
          <TaskDetail
            task={selected}
            onEdit={openEdit}
            onDelete={openDelete}
            onToggleComplete={handleToggleComplete}
            canEdit={canEdit(selected)}
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
