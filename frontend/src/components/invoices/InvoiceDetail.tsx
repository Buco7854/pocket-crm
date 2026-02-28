import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, CheckCircle } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Invoice, InvoiceStatus } from '@/types/models'

const allStatuses: InvoiceStatus[] = ['brouillon', 'emise', 'payee', 'en_retard', 'annulee']

interface Props {
  invoice: Invoice & { expand?: { contact?: { first_name: string; last_name: string }; company?: { name: string }; owner?: { name: string } } }
  onEdit: () => void
  onDelete: () => void
  onMarkPaid: () => void
  onStatusChange: (status: InvoiceStatus) => void
  canEdit: boolean
  canDelete: boolean
}

export default function InvoiceDetail({ invoice, onEdit, onDelete, onMarkPaid, onStatusChange, canEdit, canDelete }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'
  const fmtCurrency = (val: number) =>
    val != null ? new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(val) : '—'

  const isPaid = invoice.status === 'payee'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-1">{t('invoices.invoice')}</p>
          <h2 className="text-xl font-bold text-surface-900">{invoice.number}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-primary-600">{fmtCurrency(invoice.total)}</span>
            <Badge variant={invoice.status as InvoiceStatus}>{t(`invoiceStatus.${invoice.status}`)}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {canEdit && !isPaid && (
            <Button variant="primary" size="sm" icon={<CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />} onClick={onMarkPaid}>
              {t('invoices.markPaid', { defaultValue: 'Marquer payée' })}
            </Button>
          )}
          {canEdit && <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>{t('common.edit')}</Button>}
          {canDelete && <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>{t('common.delete')}</Button>}
        </div>
      </div>

      {/* Status quick-change */}
      {canEdit && (
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-2 uppercase tracking-wider">{t('fields.status')}</label>
          <div className="flex flex-wrap gap-1.5">
            {allStatuses.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  invoice.status === s
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {t(`invoiceStatus.${s}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm border-t border-surface-200 pt-4">
        <div>
          <span className="text-surface-500">{t('entities.contact')}:</span>
          <span className="text-surface-900 ml-1">
            {(invoice as any).expand?.contact
              ? `${(invoice as any).expand.contact.first_name} ${(invoice as any).expand.contact.last_name}`
              : '—'}
          </span>
        </div>
        <div><span className="text-surface-500">{t('fields.company')}:</span> <span className="text-surface-900 ml-1">{(invoice as any).expand?.company?.name || '—'}</span></div>
        <div><span className="text-surface-500">{t('fields.owner')}:</span> <span className="text-surface-900 ml-1">{(invoice as any).expand?.owner?.name || '—'}</span></div>
        <div><span className="text-surface-500">{t('invoices.issuedAt')}:</span> <span className="text-surface-900 ml-1">{fmt(invoice.issued_at)}</span></div>
        <div><span className="text-surface-500">{t('invoices.dueAt')}:</span> <span className="text-surface-900 ml-1">{fmt(invoice.due_at)}</span></div>
        {invoice.paid_at && <div><span className="text-surface-500">{t('invoices.paidAt')}:</span> <span className="text-surface-900 ml-1">{fmt(invoice.paid_at)}</span></div>}
      </div>

      {/* Line items */}
      {invoice.items?.length > 0 && (
        <div className="border-t border-surface-200 pt-4">
          <h4 className="text-sm font-medium text-surface-700 mb-3">{t('invoices.items', { defaultValue: 'Lignes' })}</h4>
          <div className="overflow-x-auto rounded-lg border border-surface-200">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">{t('fields.description')}</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-surface-500">{t('invoices.qty', { defaultValue: 'Qté' })}</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-surface-500">{t('invoices.unitPrice', { defaultValue: 'Prix unit.' })}</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-surface-500">{t('invoices.lineTotal', { defaultValue: 'Total' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-surface-900">{item.description || '—'}</td>
                    <td className="px-3 py-2 text-right text-surface-600">{item.qty}</td>
                    <td className="px-3 py-2 text-right text-surface-600">{fmtCurrency(item.unit_price)}</td>
                    <td className="px-3 py-2 text-right font-medium text-surface-900">{fmtCurrency(item.qty * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-surface-200 bg-surface-50">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right text-xs text-surface-500">{t('invoices.amountHT')}</td>
                  <td className="px-3 py-2 text-right font-medium text-surface-900">{fmtCurrency(invoice.amount)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right text-xs text-surface-500">{t('invoices.taxRate')} ({invoice.tax_rate}%)</td>
                  <td className="px-3 py-2 text-right font-medium text-surface-900">{fmtCurrency(invoice.amount * invoice.tax_rate / 100)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold text-surface-900">{t('invoices.totalTTC')}</td>
                  <td className="px-3 py-2 text-right font-bold text-primary-600">{fmtCurrency(invoice.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {invoice.notes && (
        <div className="border-t border-surface-200 pt-4">
          <h4 className="text-sm font-medium text-surface-700 mb-2">{t('fields.notes')}</h4>
          <p className="text-sm text-surface-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
