import { useTranslation } from 'react-i18next'
import Table, { type TableColumn } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import type { Contact, ContactTag } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const tagVariant: Record<ContactTag, BadgeVariant> = {
  prospect: 'primary', client: 'success', partenaire: 'info', fournisseur: 'warning',
}

interface Props {
  contacts: Contact[]
  loading: boolean
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  onRowClick: (contact: Contact) => void
}

export default function ContactList({ contacts, loading, sortBy, sortDir, onSort, onRowClick }: Props) {
  const { t } = useTranslation()

  const columns: TableColumn<Contact>[] = [
    {
      key: 'last_name', labelKey: 'fields.name', sortable: true,
      render: (_val, row) => <span className="font-medium">{row.first_name} {row.last_name}</span>,
    },
    { key: 'email', labelKey: 'fields.email' },
    { key: 'phone', labelKey: 'fields.phone' },
    { key: 'position', labelKey: 'fields.position' },
    {
      key: 'company', labelKey: 'fields.company',
      render: (_val, row) => (row as any).expand?.company?.name || '—',
    },
    {
      key: 'tags', labelKey: 'fields.tags',
      render: (val) => {
        const tags = val as unknown as ContactTag[]
        return tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => <Badge key={tag} variant={tagVariant[tag]} size="sm">{t(`contactTag.${tag}`)}</Badge>)}
          </div>
        ) : null
      },
    },
  ]

  return (
    <Table<Contact>
      columns={columns}
      data={contacts}
      loading={loading}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={onRowClick}
    />
  )
}
