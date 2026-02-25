import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, CheckCircle2, RotateCcw } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import type { Task, TaskStatus, Priority } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusVariant: Record<TaskStatus, BadgeVariant> = {
  a_faire: 'default', en_cours: 'primary', terminee: 'success', annulee: 'danger',
}
const priorityVariant: Record<Priority, BadgeVariant> = {
  basse: 'default', moyenne: 'info', haute: 'warning', urgente: 'danger',
}

interface Props {
  task: Task & { expand?: { assignee?: { name: string }; contact?: { first_name: string; last_name: string }; company?: { name: string } } }
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
  canEdit: boolean
  canDelete: boolean
}

export default function TaskDetail({ task, onEdit, onDelete, onToggleComplete, canEdit, canDelete }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (date: string) => date ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : '—'
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'terminee' && task.status !== 'annulee'
  const isDone = task.status === 'terminee'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900">{task.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={statusVariant[task.status]}>{t(`taskStatus.${task.status}`)}</Badge>
            <Badge variant={priorityVariant[task.priority]} dot>{t(`priority.${task.priority}`)}</Badge>
            {task.type && <Badge variant="default">{t(`taskType.${task.type}`)}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {canEdit && (
            <Button
              variant={isDone ? 'secondary' : 'primary'}
              size="sm"
              icon={isDone ? <RotateCcw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={onToggleComplete}
            >
              {isDone ? t('common.reopen') : t('common.markComplete')}
            </Button>
          )}
          {canEdit && <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>{t('common.edit')}</Button>}
          {canDelete && <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>{t('common.delete')}</Button>}
        </div>
      </div>

      {isOverdue && <Alert type="warning">{t('fields.dueDate')}: {fmt(task.due_date)} — overdue</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm border-t border-surface-200 pt-4">
        <div><span className="text-surface-500">{t('fields.dueDate')}:</span> <span className="text-surface-900 ml-1">{fmt(task.due_date)}</span></div>
        <div><span className="text-surface-500">{t('fields.reminderAt')}:</span> <span className="text-surface-900 ml-1">{fmt(task.reminder_at)}</span></div>
        <div><span className="text-surface-500">{t('fields.assignee')}:</span> <span className="text-surface-900 ml-1">{(task as any).expand?.assignee?.name || '—'}</span></div>
        <div>
          <span className="text-surface-500">{t('entities.contact')}:</span>
          <span className="text-surface-900 ml-1">
            {(task as any).expand?.contact ? `${(task as any).expand.contact.first_name} ${(task as any).expand.contact.last_name}` : '—'}
          </span>
        </div>
        <div><span className="text-surface-500">{t('fields.company')}:</span> <span className="text-surface-900 ml-1">{(task as any).expand?.company?.name || '—'}</span></div>
        {task.completed_at && <div><span className="text-surface-500">{t('fields.completedAt')}:</span> <span className="text-surface-900 ml-1">{fmt(task.completed_at)}</span></div>}
      </div>

      {task.description && (
        <div className="border-t border-surface-200 pt-4">
          <h4 className="text-sm font-medium text-surface-700 mb-2">{t('fields.description')}</h4>
          <p className="text-sm text-surface-600 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}
    </div>
  )
}
