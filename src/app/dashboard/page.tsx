'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Skeleton from 'react-loading-skeleton'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { useRole } from '@/components/RoleProvider'
import StatsCards from '@/components/Dashboard/StatsCards'
import TrendChart from '@/components/Dashboard/TrendChart'
import CategoryChart from '@/components/Dashboard/CategoryChart'
import InsightsCard from '@/components/Dashboard/InsightsCard'
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
  categoryBreakdown?: CategoryDatum[]
}

interface CategoryDatum {
  category: string
  totalScore: number
  evaluations: number
  [key: string]: string | number
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
  const [authReady, setAuthReady] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryDatum[]>([])
  const [recentEvals, setRecentEvals] = useState<EvaluationRow[]>([])
  const [days, setDays] = useState(7)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false) // Track if we've loaded data before
  const previousStats7DayRef = useRef<StatsData | null>(null)
  const previousStats30DayRef = useRef<StatsData | null>(null)
  const requestIdRef = useRef(0)
  const hasLoadedOnceRef = useRef(false)
  const router = useRouter()
  const supabase = createClient()
  const { notify } = useToast()
  const { isAdmin } = useRole()
  const skeletonPalette = useSkeletonPalette()

  const loadData = useCallback(async () => {
    const requestId = ++requestIdRef.current
    const isInitialRequest = !hasLoadedOnceRef.current
    const minSkeletonMs = isInitialRequest ? 250 : 0
    const startedAt = Date.now()

    if (isInitialRequest) {
      setLoading(true)
    }
    
    try {
      // Use cached fetch for faster subsequent loads
      const [statsResponse, evalsResponse] = await Promise.all([
        cachedFetch(`/api/evals/stats?days=${days}`, undefined, 15000), // 15s cache
        cachedFetch('/api/evals?limit=10', undefined, 10000), // 10s cache
      ])
      
      if (statsResponse.ok) {
        const responseData = await statsResponse.json() as { data: StatsData } | null
        if (responseData?.data) {
          const { data } = responseData
          setCategoryData(data.categoryBreakdown || [])
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
      if (minSkeletonMs > 0 && elapsed < minSkeletonMs) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, minSkeletonMs - elapsed)
        })
      }

      if (requestId !== requestIdRef.current) {
        return
      }

      if (isInitialRequest) {
        setLoading(false)
        hasLoadedOnceRef.current = true
      }

      setHasLoadedOnce(true)
    }
  }, [days, notify])

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) {
        return
      }

      if (!user) {
        router.push('/login')
        return
      }

      setAuthReady(true)
    }

    void checkAuth()

    return () => {
      cancelled = true
    }
  }, [router, supabase.auth])

  useEffect(() => {
    if (!authReady) {
      return
    }

    void loadData()
  }, [authReady, loadData])

  const filteredTrends = useMemo(() => stats?.dailyTrends ?? [], [stats?.dailyTrends])

  const handleRangeChange = (range: number) => {
    if (days === range) return
    setDays(range)
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
          {isAdmin && (
            <Link
              href="/evaluations"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#007AFF] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,122,255,0.2)] transition-transform duration-200 hover:scale-[1.02]"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Evaluation
            </Link>
          )}
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
        <CategoryChart data={categoryData} />
      </div>

      <InsightsCard categoryData={categoryData} selectedDays={days} />

      <RecentEvals evals={recentEvals} />
    </div>
  )
}
