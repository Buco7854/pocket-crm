import { useState, useCallback } from 'react'

interface DeleteConfirmState {
  isOpen: boolean
  itemId: string | null
  itemLabel: string
}

export function useDeleteConfirm() {
  const [state, setState] = useState<DeleteConfirmState>({ isOpen: false, itemId: null, itemLabel: '' })
  const [loading, setLoading] = useState(false)

  const requestDelete = useCallback((id: string, label: string) => {
    setState({ isOpen: true, itemId: id, itemLabel: label })
  }, [])

  const confirmDelete = useCallback(async (onDelete: (id: string) => Promise<void>) => {
    if (!state.itemId) return
    setLoading(true)
    try {
      await onDelete(state.itemId)
      setState({ isOpen: false, itemId: null, itemLabel: '' })
    } finally {
      setLoading(false)
    }
  }, [state.itemId])

  const cancelDelete = useCallback(() => {
    setState({ isOpen: false, itemId: null, itemLabel: '' })
  }, [])

  return { ...state, loading, requestDelete, confirmDelete, cancelDelete }
}
