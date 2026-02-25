import { useState, useCallback } from 'react'
import pb from '@/lib/pocketbase'
import type { BaseModel } from '@/types/models'

interface ListParams {
  page?: number
  perPage?: number
  sort?: string
  filter?: string
  expand?: string
  fields?: string
}

export function useCollection<T extends BaseModel>(collectionName: string) {
  const [items, setItems] = useState<T[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchList = useCallback(async (params: ListParams = {}) => {
    setLoading(true)
    setError(null)
    try {
      const page = params.page ?? currentPage
      const perPage = params.perPage ?? 20
      const result = await pb.collection(collectionName).getList(page, perPage, {
        sort: params.sort,
        filter: params.filter,
        expand: params.expand,
        fields: params.fields,
      })
      const typed = result as unknown as { items: T[]; totalItems: number; totalPages: number; page: number }
      setItems(typed.items)
      setTotalItems(typed.totalItems)
      setTotalPages(typed.totalPages)
      setCurrentPage(typed.page)
      return typed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fetch failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collectionName, currentPage])

  const fetchOne = useCallback(async (id: string, expand?: string) => {
    setLoading(true)
    setError(null)
    try {
      return await pb.collection(collectionName).getOne(id, { expand }) as unknown as T
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fetch failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collectionName])

  const create = useCallback(async (data: Partial<T>) => {
    setLoading(true)
    setError(null)
    try {
      return await pb.collection(collectionName).create(data) as unknown as T
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Create failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collectionName])

  const update = useCallback(async (id: string, data: Partial<T>) => {
    setLoading(true)
    setError(null)
    try {
      return await pb.collection(collectionName).update(id, data) as unknown as T
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collectionName])

  const remove = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await pb.collection(collectionName).delete(id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collectionName])

  return { items, totalItems, totalPages, currentPage, loading, error, fetchList, fetchOne, create, update, remove }
}
