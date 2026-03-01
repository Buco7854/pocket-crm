import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Select, { type SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import pb from '@/lib/pocketbase'
import type { Lead, LeadStatus, LeadSource, Priority } from '@/types/models'

const statuses: LeadStatus[] = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu']
const sources: LeadSource[] = ['site_web', 'email', 'telephone', 'salon', 'recommandation', 'autre']
const priorities: Priority[] = ['basse', 'moyenne', 'haute', 'urgente']

interface Props {
  lead?: Lead | null
  contacts: SelectOption[]
  companies: SelectOption[]
  loading: boolean
  onSubmit: (data: Partial<Lead>) => void
  onCancel: () => void
  defaultStatus?: LeadStatus
}

export default function LeadForm({ lead, contacts, companies, loading, onSubmit, onCancel, defaultStatus }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [campaignOptions, setCampaignOptions] = useState<SelectOption[]>([])
  const [form, setForm] = useState({
    title: lead?.title || '',
    value: lead?.value || 0,
    status: lead?.status || defaultStatus || 'nouveau',
    priority: lead?.priority || 'moyenne',
    source: lead?.source || '',
    contact: lead?.contact || '',
    company: lead?.company || '',
    expected_close: lead?.expected_close ? lead.expected_close.slice(0, 10) : '',
    notes: lead?.notes || '',
    campaign_id: lead?.campaign_id || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    pb.collection('campaigns').getList(1, 100, {
      filter: 'status != "brouillon"',
      sort: '-created',
      fields: 'id,name,type',
    }).then((res) => {
      setCampaignOptions([
        { value: '', label: '—' },
        ...res.items.map((c) => ({ value: c.id, label: c['name'] as string })),
      ])
    }).catch(() => {})
  }, [])

  function set(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setErrors({ title: t('validation.required') }); return }
    const data: Partial<Lead> = { ...form, value: Number(form.value) || 0 } as Partial<Lead>
    if (!form.campaign_id) delete (data as any).campaign_id
    if (!lead) (data as any).owner = user?.id
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input label={t('fields.title')} required value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
        </div>
        <Input label={t('fields.value')} type="number" step="0.01" value={form.value || ''} onChange={(e) => set('value', e.target.value)} />
        <Select label={t('fields.status')} options={statuses.map((v) => ({ value: v, label: t(`status.${v}`) }))} value={form.status} onChange={(v) => set('status', v)} />
        <Select label={t('fields.priority')} options={priorities.map((v) => ({ value: v, label: t(`priority.${v}`) }))} value={form.priority} onChange={(v) => set('priority', v)} />
        <Select label={t('fields.source')} options={sources.map((v) => ({ value: v, label: t(`leadSource.${v}`) }))} value={form.source} onChange={(v) => set('source', v)} placeholder={t('fields.source')} />
        <Select label={t('entities.contact')} options={contacts} value={form.contact} onChange={(v) => set('contact', v)} placeholder={t('entities.contact')} searchable />
        <Select label={t('fields.company')} options={companies} value={form.company} onChange={(v) => set('company', v)} placeholder={t('fields.company')} searchable />
        <Input label={t('fields.expectedClose')} type="date" value={form.expected_close} onChange={(e) => set('expected_close', e.target.value)} />
        {campaignOptions.length > 1 && (
          <div className="sm:col-span-2">
            <Select
              label={t('fields.campaignOrigin')}
              options={campaignOptions}
              value={form.campaign_id}
              onChange={(v) => set('campaign_id', v)}
              placeholder="—"
            />
          </div>
        )}
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
