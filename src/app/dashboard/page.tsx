'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Skeleton from 'react-loading-skeleton'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import StatsCards from '@/components/Dashboard/StatsCards'
import TrendChart from '@/components/Dashboard/TrendChart'
import CategoryChart from '@/components/Dashboard/CategoryChart'
import RecentEvals from '@/components/Dashboard/RecentEvals'
import { StatCardSkeletonGrid } from '@/components/Skeletons/StatCardSkeleton'
import { TrendChartSkeleton } from '@/components/Skeletons/TrendChartSkeleton'
import { CategoryChartSkeleton } from '@/components/Skeletons/CategoryChartSkeleton'
import { TableSkeleton } from '@/components/Skeletons/TableSkeleton'
import { cachedFetch } from '@/lib/cache'

const baseColorLight = 'rgba(0, 0, 0, 0.06)'
const highlightColorLight = 'rgba(0, 0, 0, 0.12)'
const baseColorDark = 'rgba(255, 255, 255, 0.08)'
const highlightColorDark = 'rgba(255, 255, 255, 0.18)'

function useSkeletonPalette() {
  const [palette, setPalette] = useState({
    baseColor: baseColorLight,
    highlightColor: highlightColorLight,
  })

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setPalette(
      prefersDark
        ? { baseColor: baseColorDark, highlightColor: highlightColorDark }
        : { baseColor: baseColorLight, highlightColor: highlightColorLight }
    )
  }, [])

  return palette
}

interface DailyTrend {
  date: string
  count: number
  avgScore: number
  avgLatency: number
}

interface StatsData {
  totalEvals: number
  avgScore: number
  avgLatency: number
  successRate: number
  totalPiiRedacted: number
  dailyTrends: DailyTrend[]
}

interface EvaluationRow {
  id: string
  interaction_id: string
  score: number
  latency_ms: number
  created_at: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true) // Start true to prevent flash
  const [stats, setStats] = useState<StatsData | null>(null)
  const [recentEvals, setRecentEvals] = useState<EvaluationRow[]>([])
  const [days, setDays] = useState(7)
  const [progress, setProgress] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false) // Track if we've loaded data before
  const previousStats7DayRef = useRef<StatsData | null>(null)
  const previousStats30DayRef = useRef<StatsData | null>(null)
  const requestIdRef = useRef(0)
  const router = useRouter()
  const supabase = createClient()
  const { notify } = useToast()
  const skeletonPalette = useSkeletonPalette()

  const loadData = useCallback(async () => {
    const minSkeletonMs = 250
    const startedAt = Date.now()
    const requestId = ++requestIdRef.current
    setLoading(true)
    
    try {
      // Use cached fetch for faster subsequent loads
      const [statsResponse, evalsResponse] = await Promise.all([
        cachedFetch(`/api/evals/stats?days=${days}`, undefined, 15000), // 15s cache
        cachedFetch('/api/evals?limit=10', undefined, 10000) // 10s cache
      ])
      
      if (statsResponse.ok) {
        const responseData = await statsResponse.json() as { data: StatsData } | null
        if (responseData?.data) {
          const { data } = responseData
          setStats((current) => {
            // Store previous stats for the correct time period
            if (days === 7) {
              previousStats7DayRef.current = current
            } else {
              previousStats30DayRef.current = current
            }
            return data
          })
        }
      }

      if (evalsResponse.ok) {
        const responseData = await evalsResponse.json() as { data: EvaluationRow[] } | null
        if (responseData?.data) {
          const { data } = responseData
          setRecentEvals(data || [])
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      notify({
        variant: 'error',
        title: 'Failed to load dashboard',
        description: 'Unable to fetch dashboard data. Please try refreshing.',
      })
    } finally {
      const elapsed = Date.now() - startedAt
      if (elapsed < minSkeletonMs) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, minSkeletonMs - elapsed)
        })
      }

      if (requestId !== requestIdRef.current) {
        return
      }

      setLoading(false)
      setHasLoadedOnce(true)
    }
  }, [days, notify])

  useEffect(() => {
    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      await loadData()
    }

    void bootstrap()
  }, [loadData, router, supabase.auth])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (loading) {
      const startProgress = hasLoadedOnce ? 60 : 15
      const progressSpeed = hasLoadedOnce ? 300 : 240
      
      setProgress(startProgress)
      const handle = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 20, 92))
      }, progressSpeed)
      return () => window.clearInterval(handle)
    }

    setProgress(100)
    const timeout = window.setTimeout(() => setProgress(0), 400)
    return () => window.clearTimeout(timeout)
  }, [loading, hasLoadedOnce])

  const filteredTrends = useMemo(() => stats?.dailyTrends ?? [], [stats?.dailyTrends])

  const handleRangeChange = (range: number) => {
    if (days === range) return
    setLoading(true)
    startTransition(() => {
      setDays(range)
    })
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 sm:gap-8 px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16 pt-6 sm:pt-8">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton
              width={176}
              height={36}
              borderRadius={999}
              baseColor={skeletonPalette.baseColor}
              highlightColor={skeletonPalette.highlightColor}
            />
            <Skeleton
              width={248}
              height={18}
              borderRadius={999}
              baseColor={skeletonPalette.baseColor}
              highlightColor={skeletonPalette.highlightColor}
            />
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={`dashboard-range-skeleton-${index}`}
                width={78}
                height={34}
                borderRadius={999}
                baseColor={skeletonPalette.baseColor}
                highlightColor={skeletonPalette.highlightColor}
              />
            ))}
          </div>
        </div>

        <StatCardSkeletonGrid count={4} fast={hasLoadedOnce} />

        <div className="grid gap-6 sm:gap-8 xl:grid-cols-2">
          <TrendChartSkeleton fast={hasLoadedOnce} />
          <CategoryChartSkeleton fast={hasLoadedOnce} />
        </div>

        <TableSkeleton rows={6} fast={hasLoadedOnce} />
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6 sm:gap-8 px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16 pt-6 sm:pt-8">
      <AnimatePresence>
        {(isPending || progress > 0) && progress < 100 && (
          <motion.div
            key="progress-bar"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed left-0 top-0 z-30 h-1 bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE]"
          />
        )}
      </AnimatePresence>


      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-2"
        >
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
            Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E93]">
            Monitor Evaluation Volume, Quality, and Latency in Real Time.
          </p>
        </motion.div>
        <motion.div
          className="flex flex-wrap items-center gap-2 mt-0 sm:mt-2 lg:mt-0"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        >
          {[7, 14, 30].map((range) => {
            const isActive = days === range
            return (
              <motion.button
                key={`range-${range}`}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleRangeChange(range)}
                className={
                  'relative inline-flex items-center justify-center overflow-hidden rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors'
                }
              >
                <span
                  className={
                    isActive
                      ? 'text-white'
                      : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                  }
                >
                  {range} days
                </span>
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="range-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-[#007AFF] shadow-[0_4px_12px_rgba(0,122,255,0.2)]"
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      {stats && (
        <StatsCards
          stats={stats}
          previousStats={days === 7 ? previousStats7DayRef.current : previousStats30DayRef.current}
        />
      )}

      <div className="grid gap-6 sm:gap-8 xl:grid-cols-2">
        <TrendChart
          data={filteredTrends}
          selectedDays={days}
          onRangeChange={handleRangeChange}
        />
        <CategoryChart days={days} />
      </div>

      <RecentEvals evals={recentEvals} />
    </div>
  )
}
