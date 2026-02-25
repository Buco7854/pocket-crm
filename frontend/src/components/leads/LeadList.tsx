import { useTranslation } from 'react-i18next'
import Table, { type TableColumn } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import type { Lead, LeadStatus, Priority } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const priorityVariant: Record<Priority, BadgeVariant> = {
  basse: 'default', moyenne: 'info', haute: 'warning', urgente: 'danger',
}

interface Props {
  leads: Lead[]
  loading: boolean
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  onRowClick: (lead: Lead) => void
}

export default function LeadList({ leads, loading, sortBy, sortDir, onSort, onRowClick }: Props) {
  const { t, i18n } = useTranslation()

  const fmtCurrency = (val: number) => val ? new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val) : '—'
  const fmtDate = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'

  const columns: TableColumn<Lead>[] = [
    { key: 'title', labelKey: 'fields.title', sortable: true },
    {
      key: 'value', labelKey: 'fields.value', sortable: true, align: 'right',
      render: (val) => <span className="font-medium">{fmtCurrency(val as number)}</span>,
    },
    {
      key: 'status', labelKey: 'fields.status', sortable: true,
      render: (val) => <Badge variant={val as LeadStatus}>{t(`status.${val}`)}</Badge>,
    },
    {
      key: 'priority', labelKey: 'fields.priority', sortable: true,
      render: (val) => val ? <Badge variant={priorityVariant[val as Priority]} dot>{t(`priority.${val}`)}</Badge> : null,
    },
    {
      key: 'source', labelKey: 'fields.source',
      render: (val) => val ? t(`leadSource.${val}`) : '—',
    },
    {
      key: 'expected_close', labelKey: 'fields.expectedClose', sortable: true,
      render: (val) => fmtDate(val as string),
    },
    {
      key: 'company', labelKey: 'fields.company',
      render: (_val, row) => (row as any).expand?.company?.name || '—',
    },
  ]

  return (
    <Table<Lead>
      columns={columns}
      data={leads}
      loading={loading}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={onRowClick}
    />
  )
}
