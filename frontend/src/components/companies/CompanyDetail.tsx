import { useTranslation } from 'react-i18next'
import { Globe, Mail, Phone, MapPin } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { Company, CompanySize } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const sizeVariant: Record<CompanySize, BadgeVariant> = {
  tpe: 'default', pme: 'info', eti: 'primary', grande_entreprise: 'warning',
}

interface Props {
  company: Company & { expand?: { owner?: { name: string } } }
}

export default function CompanyDetail({ company }: Props) {
  const { t, i18n } = useTranslation()

  const fmt = (date: string) => date ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(date)) : '—'
  const fmtCurrency = (val: number) => val ? new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val) : '—'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-900">{company.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          {company.industry && <span className="text-sm text-surface-500">{company.industry}</span>}
          {company.size && <Badge variant={sizeVariant[company.size]}>{t(`companySize.${company.size}`)}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {company.website && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <Globe className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline break-all min-w-0">{company.website}</a>
          </div>
        )}
        {company.email && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <Mail className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <a href={`mailto:${company.email}`} className="hover:underline break-all min-w-0">{company.email}</a>
          </div>
        )}
        {company.phone && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <Phone className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <a href={`tel:${company.phone}`} className="hover:underline min-w-0">{company.phone}</a>
          </div>
        )}
        {(company.address || company.city || company.country) && (
          <div className="flex items-center gap-2 text-surface-600 min-w-0">
            <MapPin className="h-4 w-4 text-surface-400 shrink-0" strokeWidth={2} />
            <span className="min-w-0">{[company.address, company.city, company.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm border-t border-surface-200 pt-4">
        <div><span className="text-surface-500">{t('fields.revenue')}:</span> <span className="text-surface-900 font-medium ml-1">{fmtCurrency(company.revenue)}</span></div>
        <div><span className="text-surface-500">{t('fields.owner')}:</span> <span className="text-surface-900 ml-1">{(company as any).expand?.owner?.name || '—'}</span></div>
        <div><span className="text-surface-500">{t('fields.createdAt')}:</span> <span className="text-surface-900 ml-1">{fmt(company.created)}</span></div>
        <div><span className="text-surface-500">{t('fields.updatedAt')}:</span> <span className="text-surface-900 ml-1">{fmt(company.updated)}</span></div>
      </div>

      {company.notes && (
        <div className="border-t border-surface-200 pt-4">
          <h4 className="text-sm font-medium text-surface-700 mb-2">{t('fields.notes')}</h4>
          <p className="text-sm text-surface-600 whitespace-pre-wrap">{company.notes}</p>
        </div>
      )}
    </div>
  )
}
