import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAsyncOptions {
  immediate?: boolean
}

interface UseAsyncResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: () => void
}

export function useAsync<T>(
  fn: () => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const execute = useCallback(() => {
    setLoading(true)
    setError(null)
    fnRef.current()
      .then((result) => {
        setData(result)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (options.immediate) execute()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, execute }
}
