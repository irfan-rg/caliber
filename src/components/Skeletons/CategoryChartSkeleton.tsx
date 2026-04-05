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

export function CategoryChartSkeleton({ fast = false }: { fast?: boolean }) {
  const colors = useSkeletonPalette()

  return (
    <motion.section
      className="relative h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 bg-white/90 p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#1D1D1F]/85"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: fast ? 0.06 : 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
        <div className="relative h-[240px] sm:h-[320px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[168px] w-[168px] sm:h-[188px] sm:w-[188px]">
              <Skeleton
                circle
                width="100%"
                height="100%"
                baseColor={colors.baseColor}
                highlightColor={colors.highlightColor}
              />
              <div className="absolute inset-[29%] rounded-full bg-[var(--color-background)] border border-white/10" />
            </div>
          </div>
        </div>

        <div className="max-h-[240px] space-y-2 overflow-hidden pr-1 sm:max-h-[320px]">
          {Array.from({ length: 4 }).map((_item, index) => (
            <div
              key={`category-legend-skeleton-${index}`}
              className="rounded-2xl border border-black/5 bg-black/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton
                  width={110}
                  height={14}
                  borderRadius={8}
                  baseColor={colors.baseColor}
                  highlightColor={colors.highlightColor}
                />
                <Skeleton
                  width={62}
                  height={14}
                  borderRadius={8}
                  baseColor={colors.baseColor}
                  highlightColor={colors.highlightColor}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <Skeleton
                  width={70}
                  height={12}
                  borderRadius={8}
                  baseColor={colors.baseColor}
                  highlightColor={colors.highlightColor}
                />
                <Skeleton
                  width={44}
                  height={12}
                  borderRadius={8}
                  baseColor={colors.baseColor}
                  highlightColor={colors.highlightColor}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}