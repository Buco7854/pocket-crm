import { useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { Contact } from '@/types/models'

export function useContacts() {
  const collection = useCollection<Contact>('contacts')

  const fetchContacts = useCallback((params?: { page?: number; search?: string; tagFilter?: string[]; companyFilter?: string }) => {
    const filters: string[] = []
    if (params?.search) {
      const s = params.search.replace(/"/g, '\\"')
      filters.push(`(first_name ~ "${s}" || last_name ~ "${s}" || email ~ "${s}")`)
    }
    if (params?.tagFilter?.length) {
      for (const tag of params.tagFilter) {
        filters.push(`tags ~ "${tag.replace(/"/g, '\\"')}"`)
      }
    }
    if (params?.companyFilter) filters.push(`company = "${params.companyFilter}"`)
    return collection.fetchList({
      page: params?.page,
      filter: filters.length ? filters.join(' && ') : undefined,
      expand: 'company,owner',
    })
  }, [collection.fetchList])

  return { ...collection, fetchContacts }
}
