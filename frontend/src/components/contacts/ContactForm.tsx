import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Select, { type SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { Contact, ContactTag } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const allTags: ContactTag[] = ['prospect', 'client', 'partenaire', 'fournisseur']
const tagVariant: Record<ContactTag, BadgeVariant> = {
  prospect: 'primary', client: 'success', partenaire: 'info', fournisseur: 'warning',
}

interface Props {
  contact?: Contact | null
  companies: SelectOption[]
  loading: boolean
  onSubmit: (data: Partial<Contact>) => void
  onCancel: () => void
}

export default function ContactForm({ contact, companies, loading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    position: contact?.position || '',
    company: contact?.company || '',
    tags: contact?.tags || ([] as ContactTag[]),
    notes: contact?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function toggleTag(tag: ContactTag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = t('validation.required')
    if (!form.last_name.trim()) errs.last_name = t('validation.required')
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form as Partial<Contact>)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('fields.firstName')} required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} error={errors.first_name} />
        <Input label={t('fields.lastName')} required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} error={errors.last_name} />
        <Input label={t('fields.email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <Input label={t('fields.phone')} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label={t('fields.position')} value={form.position} onChange={(e) => set('position', e.target.value)} />
        <Select label={t('fields.company')} options={companies} value={form.company} onChange={(v) => set('company', v)} placeholder={t('fields.company')} searchable />
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-2">{t('fields.tags')}</label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`cursor-pointer transition-opacity ${form.tags.includes(tag) ? '' : 'opacity-40'}`}
            >
              <Badge variant={tagVariant[tag]}>{t(`contactTag.${tag}`)}</Badge>
            </button>
          ))}
        </div>
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
