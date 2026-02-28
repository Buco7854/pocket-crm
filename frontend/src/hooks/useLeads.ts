import { useCallback } from 'react'
import pb from '@/lib/pocketbase'
import { useCollection } from '@/hooks/useCollection'
import type { Lead } from '@/types/models'

export function useLeads() {
  const collection = useCollection<Lead>('leads')

  const fetchLeads = useCallback((params?: { page?: number; search?: string; statusFilter?: string; priorityFilter?: string; sourceFilter?: string }) => {
    const filters: string[] = []
    if (params?.search) {
      const s = params.search.replace(/"/g, '\\"')
      filters.push(`(title ~ "${s}" || notes ~ "${s}")`)
    }
    if (params?.statusFilter) filters.push(`status = "${params.statusFilter}"`)
    if (params?.priorityFilter) filters.push(`priority = "${params.priorityFilter}"`)
    if (params?.sourceFilter) filters.push(`source = "${params.sourceFilter}"`)
    return collection.fetchList({
      page: params?.page,
      filter: filters.length ? filters.join(' && ') : undefined,
      expand: 'contact,company,owner',
    })
  }, [collection.fetchList])

  const fetchPipelineLeads = useCallback(() => {
    return collection.fetchList({
      perPage: 500,
      sort: '-value',
      expand: 'contact,company,owner',
    })
  }, [collection.fetchList])

  const updateLeadStatus = useCallback((id: string, status: string) => {
    return collection.update(id, { status } as Partial<Lead>)
  }, [collection.update])

  /**
   * Subscribe to realtime changes on the leads collection.
   * Returns an unsubscribe function — call it on cleanup.
   */
  const subscribeRealtime = useCallback((onRefresh: () => void) => {
    let unsubscribed = false
    let unsubFn: (() => void) | null = null

    pb.collection('leads').subscribe('*', () => {
      if (!unsubscribed) onRefresh()
    }).then((unsub) => {
      unsubFn = unsub
    }).catch(() => {
      // Realtime unavailable (e.g. SSE not supported) — silently ignore
    })

    return () => {
      unsubscribed = true
      if (unsubFn) unsubFn()
      else pb.collection('leads').unsubscribe('*').catch(() => {})
    }
  }, [])

  return { ...collection, fetchLeads, fetchPipelineLeads, updateLeadStatus, subscribeRealtime }
}
