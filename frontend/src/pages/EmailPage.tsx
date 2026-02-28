import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Send, Clock, BarChart2 } from 'lucide-react'
import { useEmailLogs } from '@/hooks/useEmailLogs'
import EmailTemplateEditor from '@/components/email/EmailTemplateEditor'
import EmailCampaignList from '@/components/email/EmailCampaignList'
import EmailStats from '@/components/email/EmailStats'
import Badge from '@/components/ui/Badge'
import Table, { type TableColumn } from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import type { EmailLog, EmailLogStatus } from '@/types/models'

type Tab = 'templates' | 'campaigns' | 'history' | 'stats'

const statusVariant: Record<EmailLogStatus, string> = {
  envoye: 'success',
  echoue: 'danger',
  en_attente: 'default',
  ouvert: 'primary',
  clique: 'info',
}

export default function EmailPage() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const { items: logs, loading, totalPages, currentPage, fetchLogs } = useEmailLogs()
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : '—'

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    if (tab === 'history' && !historyLoaded) {
      fetchLogs({ page: 1 })
      setHistoryLoaded(true)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'templates', label: t('email.tabs.templates'), icon: <FileText className="h-4 w-4" /> },
    { key: 'campaigns', label: t('email.tabs.campaigns'), icon: <Send className="h-4 w-4" /> },
    { key: 'history', label: t('email.tabs.history'), icon: <Clock className="h-4 w-4" /> },
    { key: 'stats', label: t('email.tabs.stats'), icon: <BarChart2 className="h-4 w-4" /> },
  ]

  const historyColumns: TableColumn<EmailLog>[] = [
    {
      key: 'recipient_email', labelKey: 'fields.email',
      render: (_v, row) => (
        <div>
          <p className="text-sm font-medium text-surface-900">{row.recipient_email}</p>
          {(row as any).expand?.recipient_contact && (
            <p className="text-xs text-surface-400">
              {(row as any).expand.recipient_contact.first_name} {(row as any).expand.recipient_contact.last_name}
            </p>
          )}
        </div>
      ),
    },
    { key: 'subject', labelKey: 'fields.subject' },
    {
      key: 'status', labelKey: 'fields.status',
      render: (v) => <Badge variant={statusVariant[v as EmailLogStatus] as any}>{t(`emailLogStatus.${v}`)}</Badge>,
    },
    {
      key: 'open_count', labelKey: 'email.opens', align: 'right',
      render: (_v, row) => (
        <span className={`text-sm font-medium ${row.open_count > 0 ? 'text-primary-600' : 'text-surface-400'}`}>
          {row.open_count}
        </span>
      ),
    },
    {
      key: 'click_count', labelKey: 'email.clicks', align: 'right',
      render: (_v, row) => (
        <span className={`text-sm font-medium ${row.click_count > 0 ? 'text-success-600' : 'text-surface-400'}`}>
          {row.click_count}
        </span>
      ),
    },
    { key: 'sent_at', labelKey: 'email.sentAt', render: (v) => <span className="text-xs text-surface-500">{fmt(v as string)}</span> },
    {
      key: 'campaign_id', labelKey: 'email.campaignId',
      render: (v) => v
        ? <span className="text-xs font-mono text-surface-500">{(v as string).slice(0, 10)}…</span>
        : <span className="text-surface-300">—</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.email')}</h1>
        <p className="text-sm text-surface-500">{t('email.pageDescription')}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl inline-flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-surface-0 text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'templates' && <EmailTemplateEditor />}
      {activeTab === 'campaigns' && <EmailCampaignList />}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <Table<EmailLog>
            columns={historyColumns}
            data={logs}
            loading={loading}
          />
          {totalPages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={logs.length}
              onPageChange={(p) => fetchLogs({ page: p })}
            />
          )}
        </div>
      )}

      {activeTab === 'stats' && <EmailStats />}
    </div>
  )
}
