import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Clock, BarChart2 } from 'lucide-react'
import { useEmailLogs } from '@/hooks/useEmailLogs'
import EmailTemplateEditor from '@/components/email/EmailTemplateEditor'
import EmailStats from '@/components/email/EmailStats'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Table, { type TableColumn } from '@/components/ui/Table'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import pb from '@/lib/pocketbase'
import type { EmailLog, EmailLogStatus } from '@/types/models'

type Tab = 'templates' | 'history' | 'stats'

const statusVariant: Record<EmailLogStatus, string> = {
  envoye: 'success',
  echoue: 'danger',
  en_attente: 'default',
  ouvert: 'primary',
  clique: 'info',
}

export default function EmailPage() {
  const { t, i18n } = useTranslation()
  const { tab = 'templates' } = useParams<{ tab: string }>()
  const navigate = useNavigate()
  const activeTab = tab as Tab
  const { items: logs, loading, totalItems, totalPages, fetchLogs } = useEmailLogs()
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null)
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)

  const fmt = (d: string) => d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : '—'

  useEffect(() => {
    pb.send('/api/crm/email/smtp-status', { method: 'GET' })
      .then((res: any) => setSmtpConfigured(res?.configured ?? false))
      .catch(() => setSmtpConfigured(false))
  }, [])

  // Load history when arriving on the history tab (tab switch or direct URL)
  useEffect(() => {
    if (activeTab === 'history' && !historyLoaded) {
      fetchLogs({ page: 1 })
      setHistoryLoaded(true)
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleHistoryPageChange(p: number) {
    setHistoryPage(p)
    fetchLogs({ page: p })
  }

  const tabs: TabItem<Tab>[] = [
    { key: 'templates', label: t('email.tabs.templates'), icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'history', label: t('email.tabs.history'), icon: <Clock className="h-4 w-4" strokeWidth={1.75} /> },
    { key: 'stats', label: t('email.tabs.stats'), icon: <BarChart2 className="h-4 w-4" strokeWidth={1.75} /> },
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
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.email')}</h1>
        <p className="text-sm text-surface-500">{t('email.pageDescription')}</p>
      </div>

      {smtpConfigured === false && (
        <Alert type="warning">{t('email.smtpNotConfigured')}</Alert>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={(key) => navigate(`/email/${key}`)} />

      {activeTab === 'templates' && <EmailTemplateEditor />}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <Table<EmailLog>
            columns={historyColumns}
            data={logs}
            loading={loading}
            onRowClick={setSelectedLog}
          />
          {totalPages > 1 && (
            <Pagination
              page={historyPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handleHistoryPageChange}
            />
          )}
        </div>
      )}

      {activeTab === 'stats' && <EmailStats />}

      {/* Email log detail modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={t('email.logDetail')}
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
              <div><span className="text-surface-500">{t('fields.email')}:</span> <span className="text-surface-900 ml-1 font-medium">{selectedLog.recipient_email}</span></div>
              <div>
                <span className="text-surface-500">{t('fields.status')}:</span>
                <span className="ml-1">
                  <Badge variant={statusVariant[selectedLog.status] as any}>{t(`emailLogStatus.${selectedLog.status}`)}</Badge>
                </span>
              </div>
              <div className="sm:col-span-2"><span className="text-surface-500">{t('fields.subject')}:</span> <span className="text-surface-900 ml-1">{selectedLog.subject}</span></div>
              <div><span className="text-surface-500">{t('email.sentAt')}:</span> <span className="text-surface-900 ml-1">{fmt(selectedLog.sent_at)}</span></div>
              <div><span className="text-surface-500">{t('email.opens')}:</span> <span className={`ml-1 font-medium ${selectedLog.open_count > 0 ? 'text-primary-600' : 'text-surface-400'}`}>{selectedLog.open_count}</span></div>
              <div><span className="text-surface-500">{t('email.clicks')}:</span> <span className={`ml-1 font-medium ${selectedLog.click_count > 0 ? 'text-success-600' : 'text-surface-400'}`}>{selectedLog.click_count}</span></div>
              {selectedLog.opened_at && <div><span className="text-surface-500">Opened at:</span> <span className="text-surface-900 ml-1">{fmt(selectedLog.opened_at)}</span></div>}
              {selectedLog.clicked_at && <div><span className="text-surface-500">Clicked at:</span> <span className="text-surface-900 ml-1">{fmt(selectedLog.clicked_at)}</span></div>}
              {selectedLog.campaign_id && (
                <div className="sm:col-span-2"><span className="text-surface-500">{t('email.campaignId')}:</span> <span className="text-surface-900 ml-1 font-mono text-xs">{selectedLog.campaign_id}</span></div>
              )}
              {selectedLog.error_message && (
                <div className="sm:col-span-2">
                  <span className="text-danger-600 font-medium">{selectedLog.error_message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
