import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Eye, Mail, FileText } from 'lucide-react'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Alert from '@/components/ui/Alert'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Table, { type TableColumn } from '@/components/ui/Table'
import type { EmailTemplate, EmailTemplateType } from '@/types/models'

const TEMPLATE_TYPES: EmailTemplateType[] = ['marketing', 'transactionnel', 'relance', 'bienvenue']

const VARIABLES_HINT = ['{{first_name}}', '{{last_name}}', '{{email}}', '{{company}}']

interface TemplateFormData {
  name: string
  type: EmailTemplateType
  subject: string
  body: string
  active: boolean
}

const emptyForm = (): TemplateFormData => ({
  name: '',
  type: 'marketing',
  subject: '',
  body: '',
  active: true,
})

export default function EmailTemplateEditor() {
  const { t, i18n } = useTranslation()
  const { isAdmin, isCommercial, user } = useAuthStore()
  const { items, loading, error, fetchTemplates, create, update, remove } = useEmailTemplates()

  const [formOpen, setFormOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState<TemplateFormData>(emptyForm())
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  const deleteConfirm = useDeleteConfirm()
  const canManage = isAdmin || isCommercial

  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'

  useEffect(() => { fetchTemplates() }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(tpl: EmailTemplate) {
    setEditing(tpl)
    setForm({ name: tpl.name, type: tpl.type, subject: tpl.subject, body: tpl.body, active: tpl.active })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setFormError(t('validation.required'))
      return
    }
    setFormLoading(true)
    setFormError(null)
    try {
      if (editing) {
        await update(editing.id, { ...form, created_by: user?.id })
      } else {
        await create({ ...form, created_by: user?.id } as Partial<EmailTemplate>)
      }
      setFormOpen(false)
      setEditing(null)
      fetchTemplates()
    } catch {
      setFormError(t('email.saveFailed'))
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await remove(id)
    fetchTemplates()
  }

  const columns: TableColumn<EmailTemplate>[] = [
    { key: 'name', labelKey: 'fields.name', sortable: true, render: (v) => <span className="font-medium">{v as string}</span> },
    {
      key: 'type', labelKey: 'fields.type',
      render: (v) => <Badge variant="primary">{t(`emailTemplateType.${v}`)}</Badge>,
    },
    { key: 'subject', labelKey: 'fields.subject' },
    {
      key: 'active', labelKey: 'fields.active',
      render: (v) => v
        ? <Badge variant="success">{t('common.yes')}</Badge>
        : <Badge variant="default">{t('common.no')}</Badge>,
    },
    { key: 'created', labelKey: 'fields.createdAt', render: (v) => fmt(v as string) },
    {
      key: 'id', labelKey: 'common.actions', align: 'right',
      render: (_v, row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={(ev) => { ev.stopPropagation(); setPreviewTemplate(row); setPreviewOpen(true) }} />
          {canManage && (
            <>
              <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={(ev) => { ev.stopPropagation(); openEdit(row) }} />
              <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5 text-danger-500" />}
                onClick={(ev) => { ev.stopPropagation(); deleteConfirm.requestDelete(row.id, row.name) }} />
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{t('email.templatesHint')}</p>
        {canManage && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t('common.addEntity', { entity: t('entities.emailTemplate') })}
          </Button>
        )}
      </div>

      {error && <Alert type="error" dismissible>{error}</Alert>}

      <Table<EmailTemplate>
        columns={columns}
        data={items}
        loading={loading}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? t('common.editEntity', { entity: t('entities.emailTemplate') }) : t('common.addEntity', { entity: t('entities.emailTemplate') })}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setFormOpen(false); setEditing(null) }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} loading={formLoading}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('fields.name')}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Select
              label={t('fields.type')}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v as EmailTemplateType }))}
              options={TEMPLATE_TYPES.map((tp) => ({ value: tp, label: t(`emailTemplateType.${tp}`) }))}
            />
          </div>

          <Input
            label={t('fields.subject')}
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">{t('fields.body')}</label>
            <div className="mb-2 flex flex-wrap gap-1">
              {VARIABLES_HINT.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 cursor-pointer font-mono border border-primary-200"
                  onClick={() => setForm((f) => ({ ...f, body: f.body + v }))}
                >
                  {v}
                </button>
              ))}
            </div>
            <textarea
              className="w-full min-h-[200px] rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-mono resize-y"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder={t('email.bodyPlaceholder')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tpl-active"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded accent-primary-600"
            />
            <label htmlFor="tpl-active" className="text-sm text-surface-700 cursor-pointer">{t('fields.active')}</label>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewTemplate(null) }}
        title={previewTemplate ? `${t('email.preview')}: ${previewTemplate.name}` : t('email.preview')}
        size="xl"
      >
        {previewTemplate && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="font-medium">{t('fields.subject')}:</span>
              <span>{previewTemplate.subject}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="font-medium">{t('fields.type')}:</span>
              <Badge variant="primary">{t(`emailTemplateType.${previewTemplate.type}`)}</Badge>
            </div>
            <div className="border border-surface-200 rounded-lg p-4 bg-surface-50">
              <p className="text-xs text-surface-400 mb-2 uppercase tracking-wide">{t('email.htmlPreview')}</p>
              <div
                className="prose prose-sm max-w-none text-surface-800"
                dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
              />
            </div>
          </div>
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
