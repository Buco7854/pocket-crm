import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Clock } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { Task } from '@/types/models'

interface Props {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const STATUS_DONE = new Set(['terminee', 'annulee'])

export default function TaskReminder({ tasks, onTaskClick }: Props) {
  const { t } = useTranslation()
  const now = new Date()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const overdue = useMemo(
    () =>
      tasks.filter((task) => {
        if (STATUS_DONE.has(task.status) || !task.due_date) return false
        return new Date(task.due_date) < now
      }),
    [tasks]
  )

  const dueToday = useMemo(
    () =>
      tasks.filter((task) => {
        if (STATUS_DONE.has(task.status) || !task.due_date) return false
        const d = new Date(task.due_date)
        return d >= now && d <= todayEnd
      }),
    [tasks]
  )

  const dueSoon = useMemo(
    () =>
      tasks.filter((task) => {
        if (STATUS_DONE.has(task.status) || !task.due_date) return false
        const d = new Date(task.due_date)
        return d > todayEnd && d <= in48h
      }),
    [tasks]
  )

  if (overdue.length === 0 && dueToday.length === 0 && dueSoon.length === 0) {
    return (
      <div className="rounded-xl border border-surface-200 bg-surface-0 p-6 text-center text-sm text-surface-400">
        {t('tasks.noReminders', { defaultValue: 'Aucun rappel — toutes les tâches sont à jour.' })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <ReminderSection
          icon={<AlertTriangle className="h-4 w-4 text-danger-600" strokeWidth={2} />}
          title={t('tasks.overdue', { defaultValue: 'En retard' })}
          count={overdue.length}
          tasks={overdue}
          badgeVariant="danger"
          onTaskClick={onTaskClick}
        />
      )}
      {dueToday.length > 0 && (
        <ReminderSection
          icon={<Clock className="h-4 w-4 text-warning-600" strokeWidth={2} />}
          title={t('tasks.dueToday', { defaultValue: "À faire aujourd'hui" })}
          count={dueToday.length}
          tasks={dueToday}
          badgeVariant="warning"
          onTaskClick={onTaskClick}
        />
      )}
      {dueSoon.length > 0 && (
        <ReminderSection
          icon={<Clock className="h-4 w-4 text-primary-600" strokeWidth={2} />}
          title={t('tasks.dueSoon', { defaultValue: 'À venir (48h)' })}
          count={dueSoon.length}
          tasks={dueSoon}
          badgeVariant="default"
          onTaskClick={onTaskClick}
        />
      )}
    </div>
  )
}

interface SectionProps {
  icon: React.ReactNode
  title: string
  count: number
  tasks: Task[]
  badgeVariant: 'danger' | 'warning' | 'default'
  onTaskClick: (task: Task) => void
}

function ReminderSection({ icon, title, count, tasks, badgeVariant, onTaskClick }: SectionProps) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-200 bg-surface-50">
        {icon}
        <span className="text-sm font-semibold text-surface-900">{title}</span>
        <Badge variant={badgeVariant} size="sm">{count}</Badge>
      </div>
      <ul className="divide-y divide-surface-100">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              onClick={() => onTaskClick(task)}
              className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-surface-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{task.title}</p>
                <p className="text-xs text-surface-400 mt-0.5">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : t('tasks.noDate', { defaultValue: 'Sans date' })}
                </p>
              </div>
              <Badge variant={badgeVariant} size="sm">{t(`taskType.${task.type}`)}</Badge>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
