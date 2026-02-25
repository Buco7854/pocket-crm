import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

interface Props {
  open: boolean
  title?: string
  name: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, name, loading = false, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title || t('common.confirmDelete')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{t('common.delete')}</Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-danger-50 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-danger-600" strokeWidth={2} />
        </div>
        <p className="text-sm text-surface-600 pt-2">
          {t('common.confirmDeleteMessage', { name })}
        </p>
      </div>
    </Modal>
  )
}
