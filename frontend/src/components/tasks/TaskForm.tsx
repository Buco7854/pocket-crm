import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Select, { type SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import type { Task, TaskType, TaskStatus, Priority } from '@/types/models'

const types: TaskType[] = ['appel', 'email', 'reunion', 'suivi', 'autre']
const statuses: TaskStatus[] = ['a_faire', 'en_cours', 'terminee', 'annulee']
const priorities: Priority[] = ['basse', 'moyenne', 'haute', 'urgente']

interface Props {
  task?: Task | null
  users: SelectOption[]
  contacts: SelectOption[]
  companies: SelectOption[]
  loading: boolean
  onSubmit: (data: Partial<Task>) => void
  onCancel: () => void
}

export default function TaskForm({ task, users, contacts, companies, loading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    title: task?.title || '',
    type: task?.type || 'appel',
    status: task?.status || 'a_faire',
    priority: task?.priority || 'moyenne',
    due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
    reminder_at: task?.reminder_at ? task.reminder_at.slice(0, 16) : '',
    assignee: task?.assignee || user?.id || '',
    contact: task?.contact || '',
    company: task?.company || '',
    description: task?.description || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setErrors({ title: t('validation.required') }); return }
    const data: Partial<Task> = { ...form } as Partial<Task>
    if (!task) (data as any).created_by = user?.id
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input label={t('fields.title')} required value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
        </div>
        <Select label={t('fields.type')} options={types.map((v) => ({ value: v, label: t(`taskType.${v}`) }))} value={form.type} onChange={(v) => set('type', v)} />
        <Select label={t('fields.status')} options={statuses.map((v) => ({ value: v, label: t(`taskStatus.${v}`) }))} value={form.status} onChange={(v) => set('status', v)} />
        <Select label={t('fields.priority')} options={priorities.map((v) => ({ value: v, label: t(`priority.${v}`) }))} value={form.priority} onChange={(v) => set('priority', v)} />
        <Select label={t('fields.assignee')} options={users} value={form.assignee} onChange={(v) => set('assignee', v)} placeholder={t('fields.assignee')} searchable />
        <Input label={t('fields.dueDate')} type="datetime-local" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
        <Input label={t('fields.reminderAt')} type="datetime-local" value={form.reminder_at} onChange={(e) => set('reminder_at', e.target.value)} />
        <Select label={t('fields.company')} options={companies} value={form.company} onChange={(v) => set('company', v)} placeholder={t('fields.company')} searchable />
        <Select label={t('entities.contact')} options={contacts} value={form.contact} onChange={(v) => set('contact', v)} placeholder={t('entities.contact')} searchable />
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">{t('fields.description')}</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all hover:border-surface-300"
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={loading}>{t('common.save')}</Button>
      </div>
    </form>
  )
}
