import { useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { EmailTemplate } from '@/types/models'

export function useEmailTemplates() {
  const collection = useCollection<EmailTemplate>('email_templates')

  const fetchTemplates = useCallback((params?: { page?: number; search?: string; typeFilter?: string }) => {
    const filters: string[] = []
    if (params?.search) {
      const s = params.search.replace(/"/g, '\\"')
      filters.push(`(name ~ "${s}" || subject ~ "${s}")`)
    }
    if (params?.typeFilter) {
      filters.push(`type = "${params.typeFilter.replace(/"/g, '\\"')}"`)
    }
    return collection.fetchList({
      page: params?.page,
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'created_by',
    })
  }, [collection.fetchList])

  return { ...collection, fetchTemplates }
}
