import { useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { Company } from '@/types/models'

export function useCompanies() {
  const collection = useCollection<Company>('companies')

  const fetchCompanies = useCallback((params?: { page?: number; search?: string; sizeFilter?: string; sort?: string; sortDir?: 'asc' | 'desc' }) => {
    const filters: string[] = []
    if (params?.search) {
      const s = params.search.replace(/"/g, '\\"')
      filters.push(`(name ~ "${s}" || industry ~ "${s}" || city ~ "${s}")`)
    }
    if (params?.sizeFilter) filters.push(`size = "${params.sizeFilter}"`)
    const sort = params?.sort ? `${params.sortDir === 'desc' ? '-' : ''}${params.sort}` : 'name'
    return collection.fetchList({
      page: params?.page,
      sort,
      filter: filters.length ? filters.join(' && ') : undefined,
      expand: 'owner',
    })
  }, [collection.fetchList])

  return { ...collection, fetchCompanies }
}
