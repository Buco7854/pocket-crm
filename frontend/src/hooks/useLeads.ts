import { useCallback } from 'react'
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

  return { ...collection, fetchLeads, fetchPipelineLeads, updateLeadStatus }
}
