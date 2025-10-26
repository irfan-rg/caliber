'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusSmallIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { cn, motionVariants, transitions } from '@/lib/design-system'

interface StatsData {
  totalEvals: number
  avgScore: number
  avgLatency: number
  successRate: number
  totalPiiRedacted: number
}

interface StatsCardsProps {
  stats: StatsData
  previousStats?: StatsData | null
}

type TrendDirection = 'up' | 'down' | 'flat'

interface TrendMeta {
  deltaLabel: string
  direction: TrendDirection
}

interface CardConfig {
  key: keyof StatsData
  title: string
  subtitle?: string
  icon: ReactNode
  gradient: string
  accent: string
  formatter: (value: number) => string
  trendSuffix?: string
  invertTrend?: boolean
}

function computeTrend(
  current: number,
  previous: number | undefined,
  { invertTrend, suffix }: { invertTrend?: boolean; suffix?: string }
): TrendMeta | null {
  if (previous === undefined) return null
  const deltaRaw = current - previous
  if (deltaRaw === 0) {
    return { deltaLabel: 'Steady', direction: 'flat' }
  }

  const adjustedDelta = invertTrend ? deltaRaw * -1 : deltaRaw
  const direction: TrendDirection = adjustedDelta > 0 ? 'up' : 'down'
  const rounded = Math.abs(deltaRaw)
  const formattedDelta = suffix
    ? `${rounded.toFixed(suffix.includes('%') ? 1 : 0)}${suffix}`
    : rounded >= 1000
      ? `${(rounded / 1000).toFixed(1)}k`
      : rounded.toFixed(1)

  return {
    deltaLabel: `${direction === 'up' ? '+' : '-'}${formattedDelta}`,
    direction,
  }
}

function AnimatedNumber({
  value,
  formatter,
}: {
  value: number
  formatter: (value: number) => string
}) {
  const [displayValue, setDisplayValue] = useState(() => formatter(0))

  useEffect(() => {
    let frame: number
    const duration = 900
    const start = performance.now()
    const initialValue = 0

    const loop = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const latest = initialValue + (value - initialValue) * eased
      setDisplayValue(formatter(latest))
      if (progress < 1) {
        frame = requestAnimationFrame(loop)
      }
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [value, formatter])

  return <span>{displayValue}</span>
}

const cardConfigs: CardConfig[] = [
  {
    key: 'totalEvals',
    title: 'Total Evaluations',
    subtitle: 'All-time',
    icon: <SparklesIcon className="h-5 w-5" aria-hidden="true" />,
    gradient:
      'linear-gradient(135deg, rgba(0,122,255,0.16) 0%, rgba(88,86,214,0.12) 100%)',
    accent: 'text-[#007AFF]',
    formatter: (value) => Math.round(value).toLocaleString(),
  },
  {
    key: 'avgScore',
    title: 'Average Score',
    subtitle: 'out of 100',
    icon: <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />,
    gradient:
      'linear-gradient(135deg, rgba(52,199,89,0.15) 0%, rgba(0,122,255,0.12) 100%)',
    accent: 'text-[#34C759]',
    formatter: (value) => value.toFixed(1),
    trendSuffix: '',
  },
  {
    key: 'successRate',
    title: 'Success Rate',
    subtitle: 'Score ≥ 70',
    icon: <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />,
    gradient:
      'linear-gradient(135deg, rgba(81,220,132,0.15) 0%, rgba(255,149,0,0.12) 100%)',
    accent: 'text-[#34C759]',
    formatter: (value) => `${value.toFixed(1)}%`,
    trendSuffix: '%',
  },
  {
    key: 'avgLatency',
    title: 'Average Latency',
    subtitle: 'Milliseconds',
    icon: <ClockIcon className="h-5 w-5" aria-hidden="true" />,
    gradient:
      'linear-gradient(135deg, rgba(255,149,0,0.14) 0%, rgba(255,45,85,0.12) 100%)',
    accent: 'text-[#FF9500]',
    formatter: (value) => `${Math.round(value)}ms`,
    trendSuffix: 'ms',
    invertTrend: true,
  },
  {
    key: 'totalPiiRedacted',
    title: 'PII Redacted',
    subtitle: 'Tokens removed',
    icon: <LockClosedIcon className="h-5 w-5" aria-hidden="true" />,
    gradient:
      'linear-gradient(135deg, rgba(175,82,222,0.16) 0%, rgba(255,45,85,0.14) 100%)',
    accent: 'text-[#AF52DE]',
    formatter: (value) => Math.round(value).toLocaleString(),
  },
]

export default function StatsCards({ stats, previousStats }: StatsCardsProps) {
  return (
    <motion.div
      className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5"
      variants={motionVariants.stagger}
      initial="hidden"
      animate="show"
      transition={transitions.default}
    >
      {cardConfigs.map((card) => {
        const value = stats[card.key]
        const previousValue = previousStats?.[card.key]
        const trend =
          previousValue !== undefined
            ? computeTrend(value, previousValue, {
                invertTrend: card.invertTrend,
                suffix: card.trendSuffix,
              })
            : null

        return ( 
          <motion.article
            key={card.key}
            className={cn(
              'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/50 bg-white/80 p-4 sm:p-5 shadow-[0_20px_48px_rgba(15,15,15,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#1D1D1F]/85',
              'transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_76px_rgba(15,15,15,0.18)]'
            )}
            style={{ backgroundImage: card.gradient }}
            variants={motionVariants.fadeUp}
          >
            <div className="flex items-center justify-between">
              <div className={cn('flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-white/70 text-[#1C1C1E] shadow-inner dark:bg-white/10', card.accent)}>
                {card.icon}
              </div>
              {trend && (
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium backdrop-blur-xl',
                    trend.direction === 'up'
                      ? 'bg-[#34C759]/15 text-[#34C759]'
                      : trend.direction === 'down'
                        ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                        : 'bg-black/5 text-[#8E8E93] dark:bg-white/10 dark:text-[#EBEBF5]/70'
                  )}
                >
                  {trend.direction === 'up' && (
                    <ArrowTrendingUpIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  )}
                  {trend.direction === 'down' && (
                    <ArrowTrendingDownIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  )}
                  {trend.direction === 'flat' && (
                    <MinusSmallIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  )}
                  {trend.deltaLabel}
                </span>
              )}
            </div>

            <div className="mt-4 sm:mt-6 space-y-1 sm:space-y-2">
              <p className="text-xs sm:text-sm font-medium tracking-tight text-[#1C1C1E]/80 dark:text-[#EBEBF5]/70">
                {card.title}
              </p>
              <motion.p
                className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1C1C1E] dark:text-white"
                layout
              >
                <AnimatedNumber value={value} formatter={card.formatter} />
              </motion.p>
              {card.subtitle && (
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[#8E8E93]">
                  {card.subtitle}
                </p>
              )}
            </div>
          </motion.article>
        )
      })}
    </motion.div>
  )
}
