import { useTranslation } from 'react-i18next'
import Table, { type TableColumn } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import type { Task, TaskStatus, Priority } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusVariant: Record<TaskStatus, BadgeVariant> = {
  a_faire: 'default', en_cours: 'primary', terminee: 'success', annulee: 'danger',
}
const priorityVariant: Record<Priority, BadgeVariant> = {
  basse: 'default', moyenne: 'info', haute: 'warning', urgente: 'danger',
}

interface Props {
  tasks: Task[]
  loading: boolean
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  onRowClick: (task: Task) => void
}

export default function TaskList({ tasks, loading, sortBy, sortDir, onSort, onRowClick }: Props) {
  const { t, i18n } = useTranslation()

  const fmtDate = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'
  const isOverdue = (task: Task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'terminee' && task.status !== 'annulee'

  const columns: TableColumn<Task>[] = [
    { key: 'title', labelKey: 'fields.title', sortable: true },
    {
      key: 'type', labelKey: 'fields.type',
      render: (val) => val ? <Badge variant="default">{t(`taskType.${val}`)}</Badge> : null,
    },
    {
      key: 'status', labelKey: 'fields.status', sortable: true,
      render: (val) => val ? <Badge variant={statusVariant[val as TaskStatus]}>{t(`taskStatus.${val}`)}</Badge> : null,
    },
    {
      key: 'priority', labelKey: 'fields.priority', sortable: true,
      render: (val) => val ? <Badge variant={priorityVariant[val as Priority]} dot>{t(`priority.${val}`)}</Badge> : null,
    },
    {
      key: 'due_date', labelKey: 'fields.dueDate', sortable: true,
      render: (val, row) => (
        <span className={isOverdue(row) ? 'text-danger-600 font-medium' : ''}>{fmtDate(val as string)}</span>
      ),
    },
    {
      key: 'assignee', labelKey: 'fields.assignee',
      render: (_val, row) => (row as any).expand?.assignee?.name || '—',
    },
    {
      key: 'created', labelKey: 'fields.createdAt', sortable: true,
      render: (val) => fmtDate(val as string),
    },
  ]

  return (
    <Table<Task>
      columns={columns}
      data={tasks}
      loading={loading}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={onRowClick}
    />
  )
}
