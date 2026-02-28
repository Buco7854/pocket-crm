import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Mail, FileText } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { EmailTemplate } from '@/types/models'

interface Props {
  template: EmailTemplate
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}

export default function EmailTemplateDetail({ template, canManage, onEdit, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : '—'

  return (
    <div className="space-y-6">
      {/* Header: badges + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{t(`emailTemplateType.${template.type}`)}</Badge>
          {template.active
            ? <Badge variant="success">{t('common.yes')}</Badge>
            : <Badge variant="default">{t('common.no')}</Badge>}
        </div>
        {canManage && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
              {t('common.edit')}
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>
              {t('common.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm border-t border-surface-200 pt-4">
        <div className="sm:col-span-2 flex items-start gap-2">
          <Mail className="h-4 w-4 text-surface-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-surface-500 text-xs mb-0.5">{t('fields.subject')}</p>
            <p className="text-surface-900 font-medium">{template.subject}</p>
          </div>
        </div>
        <div>
          <span className="text-surface-500">{t('fields.type')}:</span>
          <span className="text-surface-900 ml-1">{t(`emailTemplateType.${template.type}`)}</span>
        </div>
        <div>
          <span className="text-surface-500">{t('fields.active')}:</span>
          <span className="ml-1">
            {template.active
              ? <Badge variant="success">{t('common.yes')}</Badge>
              : <Badge variant="default">{t('common.no')}</Badge>}
          </span>
        </div>
        <div>
          <span className="text-surface-500">{t('fields.createdAt')}:</span>
          <span className="text-surface-900 ml-1">{fmt(template.created)}</span>
        </div>
        {template.updated && (
          <div>
            <span className="text-surface-500">{t('fields.updatedAt')}:</span>
            <span className="text-surface-900 ml-1">{fmt(template.updated)}</span>
          </div>
        )}
      </div>

      {/* Body preview */}
      <div className="border-t border-surface-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-surface-400" />
          <p className="text-sm font-medium text-surface-700">{t('email.htmlPreview')}</p>
        </div>
        <div className="border border-surface-200 rounded-lg p-4 bg-surface-50 max-h-64 overflow-y-auto">
          <div
            className="prose prose-sm max-w-none text-surface-800"
            dangerouslySetInnerHTML={{ __html: template.body }}
          />
        </div>
      </div>
    </div>
  )
}
