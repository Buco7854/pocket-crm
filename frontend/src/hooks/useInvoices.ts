import { useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { Invoice, InvoiceStatus } from '@/types/models'

export function useInvoices() {
  const collection = useCollection<Invoice>('invoices')

  const fetchInvoices = useCallback((params?: { page?: number; search?: string; statusFilter?: string; sort?: string; sortDir?: 'asc' | 'desc' }) => {
    const filters: string[] = []
    if (params?.search) {
      const s = params.search.replace(/"/g, '\\"')
      filters.push(`(number ~ "${s}" || notes ~ "${s}")`)
    }
    if (params?.statusFilter) filters.push(`status = "${params.statusFilter}"`)
    const sort = params?.sort ? `${params.sortDir === 'desc' ? '-' : ''}${params.sort}` : '-issued_at'
    return collection.fetchList({
      page: params?.page,
      sort,
      filter: filters.length ? filters.join(' && ') : undefined,
      expand: 'contact,company,owner',
    })
  }, [collection.fetchList])

  const markPaid = useCallback((id: string) => {
    return collection.update(id, {
      status: 'payee' as InvoiceStatus,
      paid_at: new Date().toISOString(),
    } as Partial<Invoice>)
  }, [collection.update])

  return { ...collection, fetchInvoices, markPaid }
}
