'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { cn, motionVariants, transitions } from '@/lib/design-system'

interface CategoryDatum {
  category: string
  totalScore: number
  evaluations: number
}

interface InsightsCardProps {
  categoryData: CategoryDatum[]
  selectedDays?: number
}

export default function InsightsCard({ categoryData, selectedDays }: InsightsCardProps) {
  const rankedCategories = useMemo(() => {
    if (!categoryData || categoryData.length === 0) {
      return []
    }

    return [...categoryData].sort((a, b) => b.totalScore - a.totalScore)
  }, [categoryData])

  const topCategory = rankedCategories[0] || null
  const runnerUp = rankedCategories[1] || null

  const totalCategoryScore = useMemo(
    () => rankedCategories.reduce((sum, item) => sum + item.totalScore, 0),
    [rankedCategories]
  )

  const topShare =
    topCategory && totalCategoryScore > 0
      ? Number(((topCategory.totalScore / totalCategoryScore) * 100).toFixed(1))
      : 0

  const topAverageScore =
    topCategory && topCategory.evaluations > 0
      ? Number((topCategory.totalScore / topCategory.evaluations).toFixed(1))
      : 0

  const averageScoreSignal = Math.max(0, Math.min(100, topAverageScore))

  return (
    <motion.section
      className={cn(
        'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 bg-white/90 p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-3xl',
        'dark:border-white/10 dark:bg-[#1D1D1F]/85'
      )}
      variants={motionVariants.fadeUp}
      initial="hidden"
      animate="show"
      transition={transitions.default}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[#8E8E93]">Key Insight</p>
          <h3 className="mt-2 text-base sm:text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
            Top Performing Category
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#8E8E93]">
            {selectedDays
              ? `Based on summed evaluation scores in last ${selectedDays} days`
              : 'Based on summed evaluation scores'}
          </p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#007AFF]/12 text-[#007AFF]">
          <SparklesIcon className="h-5 w-5" />
        </span>
      </div>

      {topCategory ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-5">
            <div>
              <p className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
                {topCategory.category}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
                {Math.round(topCategory.totalScore).toLocaleString()} pts
              </p>
            </div>
            <span className="inline-flex rounded-full border border-[#007AFF]/20 bg-[#007AFF]/10 px-3 py-1 text-xs sm:text-sm font-semibold text-[#007AFF]">
              {topShare.toFixed(1)}% share
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#34C759]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, averageScoreSignal)}%` }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[11px] sm:text-xs text-[#8E8E93]">
              Avg score signal for top category across the selected window.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
            <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-[#8E8E93] dark:border-white/10 dark:bg-white/5 dark:text-[#EBEBF5]/75">
              {topCategory.evaluations.toLocaleString()} evaluations
            </span>
            <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-[#8E8E93] dark:border-white/10 dark:bg-white/5 dark:text-[#EBEBF5]/75">
              Avg score {topAverageScore.toFixed(1)}
            </span>
            {runnerUp && (
              <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-[#8E8E93] dark:border-white/10 dark:bg-white/5 dark:text-[#EBEBF5]/75">
                Runner-up: {runnerUp.category}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-[#8E8E93]">
          No category insights yet.
        </p>
      )}
    </motion.section>
  )
}
