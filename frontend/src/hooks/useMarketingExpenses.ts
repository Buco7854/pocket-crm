import { useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { MarketingExpense } from '@/types/models'

export function useMarketingExpenses() {
  const collection = useCollection<MarketingExpense>('marketing_expenses')

  const fetchExpenses = useCallback((params?: {
    page?: number
    search?: string
    categoryFilter?: string
  }) => {
    const filters: string[] = []
    if (params?.search) {
      const s = params.search.replace(/"/g, '\\"')
      filters.push(`description ~ "${s}"`)
    }
    if (params?.categoryFilter) {
      filters.push(`category = "${params.categoryFilter}"`)
    }
    return collection.fetchList({
      page: params?.page,
      sort: '-date',
      filter: filters.length ? filters.join(' && ') : undefined,
      expand: 'created_by',
    })
  }, [collection.fetchList])

  return { ...collection, fetchExpenses }
}
