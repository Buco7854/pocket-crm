import { ref, type Ref } from 'vue'
import pb from '@/lib/pocketbase'
import type { BaseModel } from '@/types/models'
import type { ListParams, TypedListResult } from '@/types/pocketbase'

export function useCollection<T extends BaseModel>(collectionName: string) {
  const items: Ref<T[]> = ref([])
  const totalItems = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList(params: ListParams = {}) {
    loading.value = true
    error.value = null
    try {
      const page = params.page ?? currentPage.value
      const perPage = params.perPage ?? 20
      const result = await pb.collection(collectionName).getList(page, perPage, {
        sort: params.sort,
        filter: params.filter,
        expand: params.expand,
        fields: params.fields,
      }) as unknown as TypedListResult<T>

      items.value = result.items
      totalItems.value = result.totalItems
      totalPages.value = result.totalPages
      currentPage.value = result.page
      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Fetch failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string, expand?: string) {
    loading.value = true
    error.value = null
    try {
      const result = await pb.collection(collectionName).getOne(id, { expand }) as unknown as T
      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Fetch failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(data: Partial<T>) {
    loading.value = true
    error.value = null
    try {
      const result = await pb.collection(collectionName).create(data) as unknown as T
      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Create failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, data: Partial<T>) {
    loading.value = true
    error.value = null
    try {
      const result = await pb.collection(collectionName).update(id, data) as unknown as T
      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Update failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await pb.collection(collectionName).delete(id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Delete failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    totalItems,
    totalPages,
    currentPage,
    loading,
    error,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
  }
}
