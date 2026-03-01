import { useState, useCallback, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase'
import type { Period } from '@/components/stats/PeriodFilter'

export interface PipelineStage {
  stage: string
  count: number
  amount: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  created: string
  user_id: string
  user_name: string
}

export interface RevenueTrendPoint {
  month: string
  revenue: number
}

export interface DashboardStats {
  revenue: { current: number; previous: number; evolution_pct: string }
  new_prospects: { current: number; previous: number; evolution_pct: string }
  meetings_today: number
  overdue_tasks: number
  pipeline_by_stage: PipelineStage[]
  recent_activities: RecentActivity[]
  revenue_trend: RevenueTrendPoint[]
}

export function useDashboard(period: Period) {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = useCallback(() => {
    setLoading(true)
    setError(null)
    pb.send(`/api/crm/stats/dashboard?period=${period}`, { method: 'GET' })
      .then((res) => setData(res as DashboardStats))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [period])

  useEffect(() => {
    fetch()
    // Auto-refresh every 5 minutes
    timerRef.current = setInterval(fetch, 5 * 60 * 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetch])

  return { data, loading, error, refresh: fetch }
}
