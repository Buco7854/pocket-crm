import { useTranslation } from 'react-i18next'
import Table, { type TableColumn } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import type { Invoice, InvoiceStatus } from '@/types/models'

interface Props {
  invoices: Invoice[]
  loading: boolean
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  onRowClick: (invoice: Invoice) => void
}

export default function InvoiceList({ invoices, loading, sortBy, sortDir, onSort, onRowClick }: Props) {
  const { t, i18n } = useTranslation()

  const fmtCurrency = (val: number) =>
    val != null
      ? new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(val)
      : '—'
  const fmtDate = (d: string) =>
    d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(d)) : '—'

  const columns: TableColumn<Invoice>[] = [
    { key: 'number', labelKey: 'invoices.number', sortable: true },
    {
      key: 'company',
      labelKey: 'fields.company',
      render: (_val, row) => (row as any).expand?.company?.name || (row as any).expand?.contact
        ? `${(row as any).expand?.contact?.first_name ?? ''} ${(row as any).expand?.contact?.last_name ?? ''}`.trim()
        : '—',
    },
    {
      key: 'status',
      labelKey: 'fields.status',
      sortable: true,
      render: (val) => <Badge variant={val as InvoiceStatus}>{t(`invoiceStatus.${val}`)}</Badge>,
    },
    {
      key: 'amount',
      labelKey: 'invoices.amountHT',
      sortable: true,
      align: 'right',
      render: (val) => fmtCurrency(val as number),
    },
    {
      key: 'total',
      labelKey: 'invoices.totalTTC',
      sortable: true,
      align: 'right',
      render: (val) => <span className="font-semibold">{fmtCurrency(val as number)}</span>,
    },
    {
      key: 'issued_at',
      labelKey: 'invoices.issuedAt',
      sortable: true,
      render: (val) => fmtDate(val as string),
    },
    {
      key: 'due_at',
      labelKey: 'invoices.dueAt',
      sortable: true,
      render: (val) => fmtDate(val as string),
    },
    {
      key: 'owner',
      labelKey: 'fields.owner',
      render: (_val, row) => (row as any).expand?.owner?.name || '—',
    },
  ]

  return (
    <Table<Invoice>
      columns={columns}
      data={invoices}
      loading={loading}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={onRowClick}
    />
  )
}
