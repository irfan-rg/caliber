'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts'
import { cachedFetch } from '@/lib/cache'
import { cn, motionVariants, transitions } from '@/lib/design-system'

interface CategoryDatum {
  category: string
  totalScore: number
  evaluations: number
}

interface CategoryChartPoint extends CategoryDatum {
  share: number
}

interface CategoryChartProps {
  days: number
}

interface PieHoverEntry {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  payload?: CategoryChartPoint
}

interface HoverChipState {
  label: string
  x: number
  y: number
  width: number
}

const segmentColors = ['#007AFF', '#34C759', '#FF9500', '#5856D6', '#FF3B30', '#AF52DE']

export default function CategoryChart({ days }: CategoryChartProps) {
  const [data, setData] = useState<CategoryDatum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSlice, setActiveSlice] = useState<number | null>(null)
  const [hoverChip, setHoverChip] = useState<HoverChipState | null>(null)

  useEffect(() => {
    let mounted = true

    const loadCategoryData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await cachedFetch(`/api/evals/categories?days=${days}`, undefined, 15000)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const body = await response.json() as { data?: CategoryDatum[] }
        if (!mounted) {
          return
        }

        setData(body.data || [])
      } catch (fetchError) {
        console.error('Category chart error:', fetchError)
        if (mounted) {
          setError('Unable to load category data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadCategoryData()

    return () => {
      mounted = false
    }
  }, [days])

  const chartData = useMemo<CategoryChartPoint[]>(() => {
    const topCategories = data
      .slice(0, 6)
      .map((item) => ({ ...item, totalScore: Math.round(item.totalScore) }))

    const total = topCategories.reduce((sum, item) => sum + item.totalScore, 0)

    return topCategories.map((item) => ({
      ...item,
      share: total > 0 ? Number(((item.totalScore / total) * 100).toFixed(1)) : 0,
    }))
  }, [data])

  const handleSliceHover = (entry?: PieHoverEntry, index?: number) => {
    if (
      !entry ||
      typeof index !== 'number' ||
      entry.cx === undefined ||
      entry.cy === undefined ||
      entry.midAngle === undefined ||
      entry.outerRadius === undefined ||
      !entry.payload
    ) {
      clearSliceHover()
      return
    }

    const angle = -entry.midAngle * (Math.PI / 180)
    const direction = Math.cos(angle) >= 0 ? 1 : -1
    const viewWidth = entry.cx * 2
    const viewHeight = entry.cy * 2
    const label = `${entry.payload.category} ${entry.payload.share.toFixed(1)}%`
    const chipHeight = 30
    const maxChipWidth = Math.max(96, viewWidth - 12)
    const chipWidth = Math.min(Math.max(120, label.length * 7 + 20), maxChipWidth)

    let chipCenterX = entry.cx + direction * (entry.outerRadius + 56)
    let chipCenterY = entry.cy + (entry.outerRadius + 18) * Math.sin(angle)

    chipCenterX = Math.max(chipWidth / 2 + 6, Math.min(chipCenterX, viewWidth - chipWidth / 2 - 6))
    chipCenterY = Math.max(chipHeight / 2 + 6, Math.min(chipCenterY, viewHeight - chipHeight / 2 - 6))

    setActiveSlice(index)
    setHoverChip({
      label,
      x: chipCenterX,
      y: chipCenterY,
      width: chipWidth,
    })
  }

  const clearSliceHover = () => {
    setActiveSlice(null)
    setHoverChip(null)
  }

  const totalScore = useMemo(
    () => chartData.reduce((sum, item) => sum + item.totalScore, 0),
    [chartData]
  )

  if (error) {
    return (
      <motion.section
        className="glass-card flex h-[280px] sm:h-[360px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl text-center text-[#8E8E93] p-4"
        variants={motionVariants.fadeIn}
        initial="hidden"
        animate="show"
        transition={transitions.subtle}
      >
        <span className="text-xs sm:text-sm font-medium">{error}</span>
      </motion.section>
    )
  }

  if (!loading && chartData.length === 0) {
    return (
      <motion.section
        className="glass-card flex h-[280px] sm:h-[360px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl text-center text-[#8E8E93] p-4"
        variants={motionVariants.fadeIn}
        initial="hidden"
        animate="show"
        transition={transitions.subtle}
      >
        <span className="text-xs sm:text-sm font-medium">No category data yet</span>
        <p className="mt-2 max-w-sm text-[10px] sm:text-xs text-[#8E8E93]">
          Categories are derived from evaluation flags and will populate as data streams in.
        </p>
      </motion.section>
    )
  }

  return (
    <motion.section
      className={cn(
        'relative h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 bg-white/90 p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-3xl',
        'dark:border-white/10 dark:bg-[#1D1D1F]/85'
      )}
      variants={motionVariants.fadeUp}
      initial="hidden"
      animate="show"
      transition={transitions.default}
      whileHover={{ scale: 1.005 }}
    >
      <div className="mb-4 sm:mb-6 flex flex-col gap-1">
        <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
          Category Breakdown
        </h3>
        <p className="text-xs sm:text-sm text-[#8E8E93]">Total score grouped by evaluation categories</p>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
        <div className="relative h-[240px] sm:h-[320px]" onMouseLeave={clearSliceHover}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="totalScore"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={94}
                paddingAngle={3}
                minAngle={8}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1}
                labelLine={false}
                onMouseEnter={(entry, index) => handleSliceHover(entry as PieHoverEntry, index)}
                onMouseMove={(entry, index) => handleSliceHover(entry as PieHoverEntry, index)}
                onMouseLeave={clearSliceHover}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`category-slice-${entry.category}`}
                    fill={segmentColors[index % segmentColors.length]}
                    fillOpacity={activeSlice === null || activeSlice === index ? 1 : 0.42}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {hoverChip && (
            <div
              className="pointer-events-none absolute z-20"
              style={{
                left: `${hoverChip.x}px`,
                top: `${hoverChip.y}px`,
                width: `${hoverChip.width}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="rounded-full border border-white/20 bg-[rgba(18,18,22,0.95)] px-3 py-1.5 text-center text-[11px] font-semibold leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.32)]">
                {hoverChip.label}
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#8E8E93]">Total</span>
            <span className="text-base sm:text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
              {totalScore.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1 sm:max-h-[320px]">
          {chartData.map((item, index) => (
            <div
              key={`category-item-${item.category}`}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-black/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/5"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segmentColors[index % segmentColors.length] }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs sm:text-sm font-medium text-[#1C1C1E] dark:text-white">
                  {item.category}
                </p>
                <p className="text-[10px] sm:text-xs text-[#8E8E93]">{item.evaluations} evals</p>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-white">
                  {item.totalScore.toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs text-[#8E8E93]">{item.share.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}