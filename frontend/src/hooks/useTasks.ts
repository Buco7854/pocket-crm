import { useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { Task } from '@/types/models'

export function useTasks() {
  const collection = useCollection<Task>('tasks')

  const fetchTasks = useCallback((params?: { page?: number; search?: string; statusFilter?: string; priorityFilter?: string; typeFilter?: string }) => {
    const filters: string[] = []
    if (params?.search) {
      const s = params.search.replace(/"/g, '\\"')
      filters.push(`(title ~ "${s}" || description ~ "${s}")`)
    }
    if (params?.statusFilter) filters.push(`status = "${params.statusFilter}"`)
    if (params?.priorityFilter) filters.push(`priority = "${params.priorityFilter}"`)
    if (params?.typeFilter) filters.push(`type = "${params.typeFilter}"`)
    return collection.fetchList({
      page: params?.page,
      sort: '-due_date',
      filter: filters.length ? filters.join(' && ') : undefined,
      expand: 'assignee,contact,company',
    })
  }, [collection.fetchList])

  return { ...collection, fetchTasks }
}
