import { useTranslation } from 'react-i18next'
import Table, { type TableColumn } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import type { Company, CompanySize } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const sizeVariant: Record<CompanySize, BadgeVariant> = {
  tpe: 'default', pme: 'info', eti: 'primary', grande_entreprise: 'warning',
}

interface Props {
  companies: Company[]
  loading: boolean
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  onRowClick: (company: Company) => void
}

export default function CompanyList({ companies, loading, sortBy, sortDir, onSort, onRowClick }: Props) {
  const { t, i18n } = useTranslation()
  const fmtDate = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'

  const columns: TableColumn<Company>[] = [
    { key: 'name', labelKey: 'fields.name', sortable: true },
    { key: 'industry', labelKey: 'fields.industry', sortable: true },
    {
      key: 'size', labelKey: 'fields.size', sortable: true,
      render: (val) => val ? <Badge variant={sizeVariant[val as CompanySize]}>{t(`companySize.${val}`)}</Badge> : null,
    },
    { key: 'city', labelKey: 'fields.city', sortable: true },
    { key: 'email', labelKey: 'fields.email' },
    { key: 'phone', labelKey: 'fields.phone' },
    {
      key: 'created', labelKey: 'fields.createdAt', sortable: true,
      render: (val) => fmtDate(val as string),
    },
  ]

  return (
    <Table<Company>
      columns={columns}
      data={companies}
      loading={loading}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={onRowClick}
    />
  )
}
