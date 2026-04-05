'use client'

import Skeleton from 'react-loading-skeleton'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

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

export function TrendChartSkeleton({ fast = false }: { fast?: boolean }) {
  const colors = useSkeletonPalette()

  return (
    <motion.section
      className="relative h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 bg-white/90 p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#1D1D1F]/85"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: fast ? 0.06 : 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="h-[240px] sm:h-[320px] rounded-2xl border border-white/45 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="grid h-full grid-rows-6 gap-3">
          {Array.from({ length: 6 }).map((_item, index) => (
            <Skeleton
              key={`trend-line-skeleton-${index}`}
              width={`${92 - index * 5}%`}
              height={8}
              borderRadius={999}
              baseColor={colors.baseColor}
              highlightColor={colors.highlightColor}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 sm:gap-3">
        {[0, 1, 2].map((index) => (
          <Skeleton
            key={`trend-legend-skeleton-${index}`}
            width={74}
            height={14}
            borderRadius={999}
            baseColor={colors.baseColor}
            highlightColor={colors.highlightColor}
          />
        ))}
      </div>
    </motion.section>
  )
}