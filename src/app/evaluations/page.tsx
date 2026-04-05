'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { cachedFetch, type CachedResponse } from '@/lib/cache'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import EvalList, { type EvaluationRow, type EvalFilters } from '@/components/Evaluations/EvalList'
import { TableSkeleton } from '@/components/Skeletons/TableSkeleton'
import { StatCardSkeletonGrid } from '@/components/Skeletons/StatCardSkeleton'
import { ChartSkeleton } from '@/components/Skeletons/ChartSkeleton'

const PAGE_SIZE = 20
const EXPORT_PAGE_SIZE = 100

type ExportFormat = 'csv' | 'json'

interface EvalsApiResponse {
  data: EvaluationRow[]
  total: number
  totalPages: number
}

interface ExportRecord {
  interaction_id: string
  category: string
  score: number
  latency_ms: number
  pii_tokens_redacted: number
  created_at: string
  prompt: string
  response: string
}

function appendFilterParams(params: URLSearchParams, options: {
  query: string
  category: string
  startDate: string
  endDate: string
}) {
  const { query, category, startDate, endDate } = options

  if (query) {
    params.set('q', query)
  }

  if (category !== 'all') {
    params.set('category', category)
  }

  if (startDate) {
    params.set('startDate', startDate)
  }

  if (endDate) {
    params.set('endDate', endDate)
  }
}

function escapeCsvValue(value: unknown) {
  const stringValue = value == null ? '' : String(value)
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue
  }

  return `"${stringValue.replace(/"/g, '""')}"`
}

function buildCsv(rows: ExportRecord[]) {
  const headers: Array<keyof ExportRecord> = [
    'interaction_id',
    'category',
    'score',
    'latency_ms',
    'pii_tokens_redacted',
    'created_at',
    'prompt',
    'response',
  ]

  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(',')
  )

  return [headers.join(','), ...lines].join('\n')
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const DEFAULT_FILTERS: EvalFilters = {
  query: '',
  category: 'all',
  startDate: '',
  endDate: '',
}

export default function EvaluationsPage() {
  const [loading, setLoading] = useState(true) // Start true to prevent flash
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<EvalFilters>(DEFAULT_FILTERS)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false) // Track if we've loaded before
  const router = useRouter()
  const supabase = createClient()
  const { notify } = useToast()
  const initialLoad = useRef(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(filters.query.trim())
    }, 240)

    return () => window.clearTimeout(timeout)
  }, [filters.query])

  const loadEvaluations = useCallback(async () => {
    // Only show skeleton for initial load or when we have no data
    const shouldShowLoading = !hasLoadedOnce || evaluations.length === 0
    
    if (shouldShowLoading) {
      setLoading(true)
    }
    
    let cachedResponse: CachedResponse | undefined = undefined
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      })

      appendFilterParams(queryParams, {
        query: debouncedQuery,
        category: filters.category,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })

      // Use cached fetch for faster subsequent loads
      cachedResponse = await cachedFetch(`/api/evals?${queryParams.toString()}`, undefined, 8000) // 8s cache
      if (cachedResponse.fromCache) {
        setLoading(false) // End loading instantly for cached data
      }
      if (cachedResponse.ok) {
        const result = await cachedResponse.json() as EvalsApiResponse
        setEvaluations(result.data || [])
        setTotalCount(result.total || 0)
        setTotalPages(result.totalPages || 1)
      }
    } catch (error) {
      console.error('Error loading evaluations:', error)
      notify({
        variant: 'error',
        title: 'Failed to load evaluations',
        description: 'Unable to fetch evaluation data. Please try refreshing.',
      })
    } finally {
      if (!cachedResponse?.fromCache) setLoading(false) // Only for fresh data
      if (initialLoad.current) {
        initialLoad.current = false
        setHasLoadedOnce(true)
      }
    }
  }, [page, debouncedQuery, filters.category, filters.startDate, filters.endDate, hasLoadedOnce, evaluations.length, notify])

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

  const handleFiltersChange = useCallback((nextFilters: EvalFilters) => {
    setFilters(nextFilters)
    setPage(1)
  }, [])

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setDebouncedQuery('')
    setPage(1)
  }

  const fetchAllFilteredEvaluations = useCallback(async () => {
    const allRows: EvaluationRow[] = []
    const queryValue = filters.query.trim()

    for (let currentPage = 1; currentPage < 1000; currentPage += 1) {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(EXPORT_PAGE_SIZE),
      })

      appendFilterParams(queryParams, {
        query: queryValue,
        category: filters.category,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })

      const response = await fetch(`/api/evals?${queryParams.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Export request failed (${response.status})`)
      }

      const payload = await response.json() as EvalsApiResponse
      const rows = payload.data || []
      allRows.push(...rows)

      if (rows.length < EXPORT_PAGE_SIZE || currentPage >= (payload.totalPages || 1)) {
        break
      }
    }

    return allRows
  }, [filters.category, filters.endDate, filters.query, filters.startDate])

  const handleExport = async (format: ExportFormat) => {
    if (exportingFormat) return

    setExportingFormat(format)

    try {
      const rows = await fetchAllFilteredEvaluations()

      if (rows.length === 0) {
        notify({
          variant: 'warning',
          title: 'Nothing to export',
          description: 'No evaluation records match your current filters.',
        })
        return
      }

      const normalizedRows: ExportRecord[] = rows.map((row) => ({
        interaction_id: row.interaction_id,
        category: row.category || 'No Flags',
        score: typeof row.amount === 'number' ? row.amount : row.score,
        latency_ms: row.latency_ms,
        pii_tokens_redacted: row.pii_tokens_redacted ?? 0,
        created_at: row.created_at,
        prompt: row.prompt,
        response: row.response,
      }))

      const stamp = new Date().toISOString().slice(0, 10)

      if (format === 'json') {
        triggerDownload(
          JSON.stringify(normalizedRows, null, 2),
          `evaluations-${stamp}.json`,
          'application/json;charset=utf-8'
        )
      } else {
        triggerDownload(
          buildCsv(normalizedRows),
          `evaluations-${stamp}.csv`,
          'text/csv;charset=utf-8'
        )
      }

      notify({
        variant: 'success',
        title: `Exported ${format.toUpperCase()}`,
        description: `${normalizedRows.length.toLocaleString()} records downloaded.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      notify({
        variant: 'error',
        title: 'Export failed',
        description: 'Unable to export records. Please try again.',
      })
    } finally {
      setExportingFormat(null)
    }
  }

  const handleAddEvaluation = () => {
    notify({
      variant: 'default',
      title: 'Admin action (demo)',
      description: 'In a full workflow, this would open an Add Evaluation form.',
    })
  }

  const hasEvaluations = evaluations.length > 0
  const hasActiveFilters =
    debouncedQuery.length > 0 ||
    filters.category !== 'all' ||
    filters.startDate.length > 0 ||
    filters.endDate.length > 0

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
              {hasActiveFilters ? 'No Records Match Filters' : 'No Evaluations Yet'}
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93]">
              {hasActiveFilters
                ? 'Try expanding date range, search, or category filters to find matching evaluations.'
                : 'Kick off your First Evaluation by Configuring the API Connection.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full bg-[#007AFF] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,122,255,0.2)] transition-transform duration-200 hover:scale-[1.02]"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              href="/config"
              className="rounded-full bg-[#007AFF] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,122,255,0.2)] transition-transform duration-200 hover:scale-[1.02]"
            >
              Configure Settings
            </Link>
          )}
        </motion.div>
      ) : (
        <EvalList
          evaluations={evaluations}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onExport={handleExport}
          onAddEvaluation={handleAddEvaluation}
          exportingFormat={exportingFormat}
          loading={loading || isPending}
          totalCount={totalCount}
        />
      )}
    </div>
  )
}
