import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import type { Campaign, CampaignType, CampaignStatus } from '@/types/models'

const NON_EMAIL_TYPES: CampaignType[] = ['ads', 'social', 'event', 'seo', 'autre']
const STATUSES: CampaignStatus[] = ['brouillon', 'en_cours', 'termine']

interface Props {
  campaign?: Campaign | null
  loading: boolean
  onSubmit: (data: Partial<Campaign>) => void
  onCancel: () => void
}

export default function MarketingCampaignForm({ campaign, loading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()

  const [form, setForm] = useState({
    name: campaign?.name ?? '',
    type: (campaign?.type ?? 'ads') as CampaignType,
    status: (campaign?.status ?? 'en_cours') as CampaignStatus,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: t('validation.required') }); return }
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      status: form.status,
    })
  }

  const typeOptions = NON_EMAIL_TYPES.map((v) => ({ value: v, label: t(`campaignType.${v}`) }))
  const statusOptions = STATUSES.map((v) => ({ value: v, label: t(`campaignStatus.${v}`) }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label={t('fields.name')}
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
        </div>
        <Select
          label={t('campaign.type')}
          options={typeOptions}
          value={form.type}
          onChange={(v) => set('type', v as CampaignType)}
          required
        />
        <Select
          label={t('fields.status')}
          options={statusOptions}
          value={form.status}
          onChange={(v) => set('status', v as CampaignStatus)}
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={loading}>{t('common.save')}</Button>
      </div>
    </form>
  )
}
