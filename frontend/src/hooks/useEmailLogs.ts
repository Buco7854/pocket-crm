import { useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { EmailLog } from '@/types/models'

export function useEmailLogs() {
  const collection = useCollection<EmailLog>('email_logs')

  const fetchLogs = useCallback((params?: {
    page?: number
    campaignId?: string
    status?: string
    contactId?: string
  }) => {
    const filters: string[] = []
    if (params?.campaignId) filters.push(`campaign_id = "${params.campaignId.replace(/"/g, '\\"')}"`)
    if (params?.status) filters.push(`status = "${params.status.replace(/"/g, '\\"')}"`)
    if (params?.contactId) filters.push(`recipient_contact = "${params.contactId.replace(/"/g, '\\"')}"`)
    return collection.fetchList({
      page: params?.page,
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'template,recipient_contact,sent_by',
    })
  }, [collection.fetchList])

  return { ...collection, fetchLogs }
}
