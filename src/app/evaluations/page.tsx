'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { cachedFetch, type CachedResponse } from '@/lib/cache'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import EvalList, { type EvaluationRow } from '@/components/Evaluations/EvalList'
import { TableSkeleton } from '@/components/Skeletons/TableSkeleton'
import { StatCardSkeletonGrid } from '@/components/Skeletons/StatCardSkeleton'
import { ChartSkeleton } from '@/components/Skeletons/ChartSkeleton'

const PAGE_SIZE = 20

export default function EvaluationsPage() {
  const [loading, setLoading] = useState(true) // Start true to prevent flash
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false) // Track if we've loaded before
  const router = useRouter()
  const supabase = createClient()
  const initialLoad = useRef(true)

  const loadEvaluations = useCallback(async () => {
    // Only show skeleton for initial load or when we have no data
    const shouldShowLoading = !hasLoadedOnce || evaluations.length === 0
    
    if (shouldShowLoading) {
      setLoading(true)
    }
    
    let cachedResponse: CachedResponse | undefined = undefined
    try {
      // Use cached fetch for faster subsequent loads
      cachedResponse = await cachedFetch(`/api/evals?page=${page}&limit=${PAGE_SIZE}`, undefined, 8000) // 8s cache
      if (cachedResponse.fromCache) {
        setLoading(false) // End loading instantly for cached data
      }
      if (cachedResponse.ok) {
        const result = await cachedResponse.json() as { data: EvaluationRow[]; total: number; totalPages: number }
        setEvaluations(result.data || [])
        setTotalCount(result.total || 0)
        setTotalPages(result.totalPages || 1)
      }
    } catch (error) {
      console.error('Error loading evaluations:', error)
    } finally {
      if (!cachedResponse?.fromCache) setLoading(false) // Only for fresh data
      if (initialLoad.current) {
        initialLoad.current = false
        setHasLoadedOnce(true)
      }
    }
  }, [page, hasLoadedOnce, evaluations.length])

  useEffect(() => {
    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      await loadEvaluations()
    }

    void bootstrap()
  }, [loadEvaluations, router, supabase.auth])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (loading) {
      // Different progress behavior for first vs subsequent loads
      const startProgress = hasLoadedOnce ? 70 : 18
      const progressSpeed = hasLoadedOnce ? 200 : 220
      
      setProgress(startProgress)
      const handle = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 20, 85))
      }, progressSpeed)
      return () => window.clearInterval(handle)
    }
    setProgress(100)
    const timeout = window.setTimeout(() => setProgress(0), 360)
    return () => window.clearTimeout(timeout)
  }, [loading, hasLoadedOnce])

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return
    startTransition(() => {
      setPage(nextPage)
    })
  }

  const hasEvaluations = evaluations.length > 0

  // Only show skeleton on initial load when we have no evaluations data
  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex flex-1 flex-col gap-6 sm:gap-8 px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16 pt-6 sm:pt-8">
        <div className="space-y-2">
          <div className="h-8 sm:h-10 w-40 sm:w-48 animate-pulse rounded-full bg-[#007AFF]/10" />
          <div className="h-4 sm:h-5 w-56 sm:w-72 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
        </div>
        <StatCardSkeletonGrid count={4} fast={hasLoadedOnce} />
        <ChartSkeleton fast={hasLoadedOnce} />
        <TableSkeleton rows={8} fast={hasLoadedOnce} />
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6 sm:gap-8 px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16 pt-6 sm:pt-8">
      <AnimatePresence>
        {(loading || isPending || progress > 0) && progress < 100 && (
          <motion.div
            key="progress-evals"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed left-0 top-0 z-30 h-1 bg-gradient-to-r from-[#007AFF] via-[#FF9500] to-[#AF52DE]"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2 sm:gap-3"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
          Evaluations
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93]">
          Showing page {page} of {totalPages || 1}. {totalCount} total evaluations ingested.
        </p>
      </motion.div>

      {!hasEvaluations ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card flex flex-col items-center justify-center gap-4 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
        >
          <span className="text-4xl sm:text-5xl">📡</span>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-semibold text-[#1C1C1E] dark:text-white">
              No Evaluations Yet
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93]">
              Kick off your First Evaluation by Configuring the API Connection.
            </p>
          </div>
          <Link
            href="/config"
            className="rounded-full bg-[#007AFF] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,122,255,0.25)] transition-transform duration-200 hover:scale-[1.02]"
          >
            Configure Settings
          </Link>
        </motion.div>
      ) : (
        <EvalList
          evaluations={evaluations}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          loading={loading || isPending}
          totalCount={totalCount}
        />
      )}
    </div>
  )
}
