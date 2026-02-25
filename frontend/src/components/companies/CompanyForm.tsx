import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import type { Company, CompanySize } from '@/types/models'

const sizes: CompanySize[] = ['tpe', 'pme', 'eti', 'grande_entreprise']

interface Props {
  company?: Company | null
  loading: boolean
  onSubmit: (data: Partial<Company>) => void
  onCancel: () => void
}

export default function CompanyForm({ company, loading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: company?.name || '',
    industry: company?.industry || '',
    website: company?.website || '',
    email: company?.email || '',
    phone: company?.phone || '',
    size: company?.size || '',
    revenue: company?.revenue || 0,
    address: company?.address || '',
    city: company?.city || '',
    country: company?.country || '',
    notes: company?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: t('validation.required') })
      return
    }
    onSubmit({ ...form, revenue: Number(form.revenue) || 0 } as Partial<Company>)
  }

  const sizeOptions = sizes.map((s) => ({ value: s, label: t(`companySize.${s}`) }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('fields.name')} required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <Input label={t('fields.industry')} value={form.industry} onChange={(e) => set('industry', e.target.value)} />
        <Input label={t('fields.website')} type="url" value={form.website} onChange={(e) => set('website', e.target.value)} />
        <Input label={t('fields.email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <Input label={t('fields.phone')} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Select label={t('fields.size')} options={sizeOptions} value={form.size} onChange={(v) => set('size', v)} placeholder={t('fields.size')} />
        <Input label={t('fields.revenue')} type="number" value={form.revenue || ''} onChange={(e) => set('revenue', e.target.value)} />
        <Input label={t('fields.address')} value={form.address} onChange={(e) => set('address', e.target.value)} />
        <Input label={t('fields.city')} value={form.city} onChange={(e) => set('city', e.target.value)} />
        <Input label={t('fields.country')} value={form.country} onChange={(e) => set('country', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">{t('fields.notes')}</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
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
