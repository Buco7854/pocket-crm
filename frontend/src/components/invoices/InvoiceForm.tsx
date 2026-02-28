import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import Input from '@/components/ui/Input'
import Select, { type SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types/models'

const statuses: InvoiceStatus[] = ['brouillon', 'emise', 'payee', 'en_retard', 'annulee']

interface Props {
  invoice?: Invoice | null
  contacts: SelectOption[]
  companies: SelectOption[]
  leads: SelectOption[]
  loading: boolean
  onSubmit: (data: Partial<Invoice>) => void
  onCancel: () => void
}

function emptyItem(): InvoiceItem {
  return { description: '', qty: 1, unit_price: 0 }
}

export default function InvoiceForm({ invoice, contacts, companies, leads, loading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const [form, setForm] = useState({
    number: invoice?.number || '',
    contact: invoice?.contact || '',
    company: invoice?.company || '',
    lead: invoice?.lead || '',
    status: invoice?.status || 'brouillon',
    tax_rate: invoice?.tax_rate ?? 20,
    issued_at: invoice?.issued_at ? invoice.issued_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    due_at: invoice?.due_at ? invoice.due_at.slice(0, 10) : '',
    notes: invoice?.notes || '',
  })

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length ? invoice.items : [emptyItem()]
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Computed amounts
  const amount = items.reduce((sum, it) => sum + it.qty * it.unit_price, 0)
  const total = amount * (1 + form.tax_rate / 100)

  function set(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function setItem(idx: number, key: keyof InvoiceItem, value: string | number) {
    setItems((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: key === 'description' ? value : Number(value) || 0 }
      return next
    })
  }

  function addItem() { setItems((prev) => [...prev, emptyItem()]) }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.number.trim()) newErrors.number = t('validation.required')
    if (items.length === 0) newErrors.items = t('invoices.noItems', { defaultValue: 'Ajoutez au moins une ligne' })
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }

    const data: Partial<Invoice> = {
      ...form,
      tax_rate: Number(form.tax_rate) || 0,
      amount,
      total,
      items,
    } as Partial<Invoice>
    if (!invoice) (data as any).owner = user?.id
    onSubmit(data)
  }

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(val)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('invoices.number')} required value={form.number} onChange={(e) => set('number', e.target.value)} error={errors.number} placeholder="FAC-2026-001" />
        <Select label={t('fields.status')} options={statuses.map((v) => ({ value: v, label: t(`invoiceStatus.${v}`) }))} value={form.status} onChange={(v) => set('status', v)} />
        <Select label={t('entities.contact')} options={contacts} value={form.contact} onChange={(v) => set('contact', v)} placeholder={t('entities.contact')} searchable />
        <Select label={t('fields.company')} options={companies} value={form.company} onChange={(v) => set('company', v)} placeholder={t('fields.company')} searchable />
        <Select label={t('entities.lead')} options={leads} value={form.lead} onChange={(v) => set('lead', v)} placeholder={t('entities.lead')} searchable />
        <Input label={t('invoices.taxRate')} type="number" step="0.1" min="0" max="100" value={form.tax_rate} onChange={(e) => set('tax_rate', e.target.value)} />
        <Input label={t('invoices.issuedAt')} type="date" value={form.issued_at} onChange={(e) => set('issued_at', e.target.value)} />
        <Input label={t('invoices.dueAt')} type="date" value={form.due_at} onChange={(e) => set('due_at', e.target.value)} />
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-surface-700">{t('invoices.items', { defaultValue: 'Lignes' })}</label>
          <Button type="button" variant="secondary" size="sm" icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />} onClick={addItem}>
            {t('invoices.addLine', { defaultValue: 'Ajouter ligne' })}
          </Button>
        </div>
        {errors.items && <p className="text-xs text-danger-600 mb-2">{errors.items}</p>}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => setItem(idx, 'description', e.target.value)}
                  placeholder={t('fields.description')}
                  className="w-full h-9 rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => setItem(idx, 'qty', e.target.value)}
                  placeholder={t('invoices.qty', { defaultValue: 'Qté' })}
                  className="w-full h-9 rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-right"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => setItem(idx, 'unit_price', e.target.value)}
                  placeholder={t('invoices.unitPrice', { defaultValue: 'Prix unit.' })}
                  className="w-full h-9 rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-right"
                />
              </div>
              <div className="col-span-1 flex items-center justify-center h-9">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-3 flex flex-col items-end gap-1 text-sm">
          <div className="flex gap-8 text-surface-500">
            <span>{t('invoices.amountHT')}</span>
            <span className="w-32 text-right font-medium text-surface-900">{fmtCurrency(amount)}</span>
          </div>
          <div className="flex gap-8 text-surface-500">
            <span>{t('invoices.taxRate')} ({form.tax_rate}%)</span>
            <span className="w-32 text-right font-medium text-surface-900">{fmtCurrency(amount * form.tax_rate / 100)}</span>
          </div>
          <div className="flex gap-8 border-t border-surface-200 pt-1 mt-1">
            <span className="font-semibold text-surface-900">{t('invoices.totalTTC')}</span>
            <span className="w-32 text-right font-bold text-surface-900">{fmtCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">{t('fields.notes')}</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
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
