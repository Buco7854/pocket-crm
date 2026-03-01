import { useState, useCallback, useEffect } from 'react'
import pb from '@/lib/pocketbase'
import type { Period } from '@/components/stats/PeriodFilter'

export function useStats<T>(section: string, period: Period) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    setLoading(true)
    setError(null)
    pb.send(`/api/crm/stats/${section}?period=${period}`, { method: 'GET' })
      .then((res) => setData(res as T))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [section, period])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refresh: fetch }
}
