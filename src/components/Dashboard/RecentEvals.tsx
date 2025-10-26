'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowTopRightOnSquareIcon, ClockIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/design-system'

interface Evaluation {
  id: string
  interaction_id: string
  score: number
  latency_ms: number
  created_at: string
}

interface RecentEvalsProps {
  evals: Evaluation[]
}

function scoreBadge(score: number) {
  if (score >= 90) {
    return 'bg-[#34C759]/15 text-[#34C759]'
  }
  if (score >= 75) {
    return 'bg-[#007AFF]/12 text-[#007AFF]'
  }
  if (score >= 60) {
    return 'bg-[#FF9500]/15 text-[#FF9500]'
  }
  return 'bg-[#FF3B30]/15 text-[#FF3B30]'
}

export default function RecentEvals({ evals }: RecentEvalsProps) {
  const router = useRouter()

  const formattedEvals = useMemo(() => {
    return (evals ?? []).map((item) => ({
      ...item,
      createdDisplay: new Date(item.created_at).toLocaleString(),
    }))
  }, [evals])

  if (!formattedEvals || formattedEvals.length === 0) {
    return (
      <motion.section
        className="glass-card flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center text-[#8E8E93]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-xs sm:text-sm font-medium">No evaluations yet</span>
        <p className="mt-2 max-w-sm text-[10px] sm:text-xs text-[#8E8E93]">
          As soon as your first evaluation is ingested, you will see it appear here in real time.
        </p>
      </motion.section>
    )
  }

  return (
    <motion.section
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 bg-white/85 shadow-[0_24px_60px_rgba(15,15,15,0.12)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#1D1D1F]/85"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="sticky top-0 flex flex-col gap-1 border-b border-white/50 bg-white/70 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#1D1D1F]/80">
        <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
          Recent Evaluations
        </h3>
        <p className="text-xs sm:text-sm text-[#8E8E93]">Streaming the latest 10 evaluations</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead className="sticky top z-10 bg-white/80 text-left text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[#8E8E93] backdrop-blur-xl dark:bg-[#1D1D1F]/80">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Interaction</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Score</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Latency</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap hidden md:table-cell">Captured</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-medium whitespace-nowrap">Actions</th>
            </tr>
          </thead>
                    <tbody>
            {formattedEvals.map((evaluation, index) => (
              <motion.tr
                key={evaluation.id}
                className={cn(
                  'cursor-pointer select-none border-t border-white/40 text-xs sm:text-sm transition duration-200 first:border-t-0 dark:border-white/10',
                  index % 2 === 0
                    ? 'bg-white/80 dark:bg-white/5'
                    : 'bg-white/70 dark:bg-white/10'
                )}
                onClick={() => router.push(`/evaluations`)}
                whileHover={{ scale: 1.001, translateY: -1 }}
                layout
              >
                <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-[#007AFF] whitespace-nowrap">
                  {evaluation.interaction_id}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 sm:gap-2 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold backdrop-blur-xl',
                      scoreBadge(evaluation.score)
                    )}
                  >
                    {evaluation.score}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-[#8E8E93] dark:text-[#EBEBF5]/70 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs">
                    <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    {evaluation.latency_ms} ms
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-[#8E8E93] dark:text-[#EBEBF5]/70 hidden md:table-cell text-xs">
                  {evaluation.createdDisplay}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-[#007AFF]">
                    <span className="hidden sm:inline">View All</span>
                    <span className="sm:hidden">View</span>
                    <ArrowTopRightOnSquareIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  )
}
