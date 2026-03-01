import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import pb from '@/lib/pocketbase'
import type { MarketingExpense, MarketingExpenseCategory } from '@/types/models'

const CATEGORIES: MarketingExpenseCategory[] = [
  'email', 'site_web', 'salon', 'telephone', 'recommandation', 'autre',
]

interface Props {
  expense?: MarketingExpense | null
  loading: boolean
  onSubmit: (data: Partial<MarketingExpense>) => void
  onCancel: () => void
}

export default function MarketingExpenseForm({ expense, loading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const [campaignOptions, setCampaignOptions] = useState<{ value: string; label: string }[]>([])

  const [form, setForm] = useState({
    date: expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    amount: expense?.amount ?? 0,
    category: (expense?.category ?? 'email') as MarketingExpenseCategory,
    description: expense?.description ?? '',
    campaign_id: expense?.campaign_id ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Campaigns filtered by type: email expenses → email campaigns; others → non-email campaigns
  useEffect(() => {
    const typeFilter = form.category === 'email' ? 'type = "email"' : 'type != "email"'
    pb.collection('campaigns').getList(1, 100, {
      filter: `status != "brouillon" && ${typeFilter}`,
      sort: '-created',
      fields: 'id,name,type',
    }).then((res) => {
      setCampaignOptions([
        { value: '', label: '—' },
        ...res.items.map((c) => ({ value: c.id, label: c['name'] as string })),
      ])
    }).catch(() => {})
  }, [form.category])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    if (key === 'category') {
      // Reset campaign when switching between email ↔ non-email
      const prevIsEmail = form.category === 'email'
      const nextIsEmail = value === 'email'
      if (prevIsEmail !== nextIsEmail) {
        setForm((f) => ({ ...f, [key]: value, campaign_id: '' }))
        if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
        return
      }
    }
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.date) errs.date = t('validation.required')
    if (!form.amount || form.amount <= 0) errs.amount = t('validation.required')
    if (!form.category) errs.category = t('validation.required')
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload: Partial<MarketingExpense> = {
      date: form.date,
      amount: Number(form.amount),
      category: form.category,
      description: form.description.trim(),
    }
    if (form.campaign_id) payload.campaign_id = form.campaign_id
    onSubmit(payload)
  }

  const categoryOptions = CATEGORIES.map((c) => ({
    value: c,
    label: t(`leadSource.${c}`),
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('marketingExpenses.date')}
          type="date"
          required
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />
        <Input
          label={t('marketingExpenses.amount')}
          type="number"
          min={0}
          step="0.01"
          required
          value={form.amount === 0 ? '' : String(form.amount)}
          onChange={(e) => set('amount', Number(e.target.value))}
          error={errors.amount}
        />
        <div className="sm:col-span-2">
          <Select
            label={t('marketingExpenses.category')}
            options={categoryOptions}
            value={form.category}
            onChange={(v) => set('category', v as MarketingExpenseCategory)}
            required
          />
        </div>
        {campaignOptions.length > 1 && (
          <div className="sm:col-span-2">
            <Select
              label={t('marketingExpenses.campaign')}
              options={campaignOptions}
              value={form.campaign_id}
              onChange={(v) => set('campaign_id', v)}
              placeholder="—"
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            {t('marketingExpenses.description')}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder={t('marketingExpenses.descriptionPlaceholder')}
            className="w-full rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all hover:border-surface-300"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={loading}>{t('common.save')}</Button>
      </div>
    </form>
  )
}
