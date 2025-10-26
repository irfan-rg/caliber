'use client'

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { cn, chartConfig, motionVariants, transitions } from '@/lib/design-system'

interface DailyTrend {
  date: string
  count: number
  avgScore: number
  avgLatency: number
}

interface TrendChartProps {
  data: DailyTrend[]
}

interface TooltipPayloadItem {
  color?: string
  name?: string
  value?: number | string
}

interface CustomTooltipProps {
  active?: boolean
  label?: string
  payload?: TooltipPayloadItem[]
}

function CustomTooltip({
  active,
  label,
  payload,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card flex flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8E8E93]">
        {label}
      </p>
      {payload.map((entry, index) => (
        <div key={entry.name || index} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color ?? '#007AFF' }}
          />
          <span className="font-medium text-[#1C1C1E] dark:text-white">
            {entry.name}
          </span>
          <span className="ml-auto text-[#8E8E93] dark:text-[#EBEBF5]/70">
            {entry.value}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

export default function TrendChart({ data }: TrendChartProps) {
  const formattedData = useMemo(() => {
    return (data ?? []).map((item) => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      avgLatencyDisplay: `${Math.round(item.avgLatency)} ms`,
      avgScoreDisplay: item.avgScore.toFixed(1),
    }))
  }, [data])

  if (!formattedData || formattedData.length === 0) {
    return (
      <motion.div
        className="glass-card flex h-[280px] sm:h-[360px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl text-center text-[#8E8E93] p-4"
        variants={motionVariants.fadeIn}
        initial="hidden"
        animate="show"
        transition={transitions.subtle}
      >
        <span className="text-xs sm:text-sm font-medium">No trend data yet</span>
        <p className="mt-2 max-w-sm text-[10px] sm:text-xs text-[#8E8E93]">
          Once evaluations begin streaming in, you will see accuracy and latency trends come alive here.
        </p>
      </motion.div>
    )
  }

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
      whileHover={{ scale: 1.005 }}
    >
      <div className="mb-4 sm:mb-6 flex flex-col gap-1 sm:gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
            Daily Performance Trends
          </h3>
          <p className="text-xs sm:text-sm text-[#8E8E93]">Score and latency across the selected window</p>
        </div>
      </div>
      <div className="h-[240px] sm:h-[320px]">
        <ResponsiveContainer>
          <LineChart data={formattedData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#34C759" stopOpacity={0.35} />
                <stop offset="80%" stopColor="#34C759" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="latencyGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#FF9500" stopOpacity={0.3} />
                <stop offset="80%" stopColor="#FF9500" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(28,28,30,0.08)" vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: 'rgba(28,28,30,0.45)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              stroke="transparent"
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'rgba(28,28,30,0.45)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              stroke="transparent"
              domain={[0, 100]}
              width={32}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'rgba(28,28,30,0.35)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              stroke="transparent"
              width={32}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,122,255,0.15)', strokeWidth: 2 }} />
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              formatter={(value) => (
                <span className="text-[10px] sm:text-xs text-[#8E8E93]">{value}</span>
              )}
            />
            <Line
              yAxisId="left"
              type={chartConfig.curveType}
              dataKey="avgScore"
              name="Avg Score"
              stroke="#34C759"
              strokeWidth={chartConfig.strokeWidth}
              dot={{ r: chartConfig.dotRadius - 1, strokeWidth: 0, fill: '#34C759' }}
              activeDot={{ r: chartConfig.dotRadius + 1, stroke: '#FFFFFF', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={600}
            />
            <Line
              yAxisId="right"
              type={chartConfig.curveType}
              dataKey="avgLatency"
              name="Latency (ms)"
              stroke="#FF9500"
              strokeWidth={chartConfig.strokeWidth}
              dot={{ r: chartConfig.dotRadius - 1, strokeWidth: 0, fill: '#FF9500' }}
              activeDot={{ r: chartConfig.dotRadius + 1, stroke: '#FFFFFF', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={600}
            />
            <Line
              yAxisId="left"
              type={chartConfig.curveType}
              dataKey="count"
              name="Evals"
              stroke="#5856D6"
              strokeWidth={chartConfig.strokeWidth - 0.5}
              dot={{ r: chartConfig.dotRadius - 1.5, strokeWidth: 0, fill: '#5856D6' }}
              activeDot={{ r: chartConfig.dotRadius, stroke: '#FFFFFF', strokeWidth: 2 }}
              strokeDasharray="6 6"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  )
}
