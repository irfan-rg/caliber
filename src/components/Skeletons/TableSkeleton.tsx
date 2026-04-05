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
    // Only check theme preference on client side after hydration
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setPalette(
      prefersDark
        ? { baseColor: baseColorDark, highlightColor: highlightColorDark }
        : { baseColor: baseColorLight, highlightColor: highlightColorLight }
    )
  }, [])

  return palette
}

export function TableSkeleton({ rows = 6, fast = false }: { rows?: number; fast?: boolean }) {
  const colors = useSkeletonPalette()

  return (
    <motion.div
      className="glass-card w-full rounded-3xl p-4"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: fast ? 0.06 : 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-4 flex items-center justify-between">
        <Skeleton
          width={200}
          height={24}
          borderRadius={12}
          baseColor={colors.baseColor}
          highlightColor={colors.highlightColor}
        />
        <Skeleton
          width={140}
          height={20}
          borderRadius={999}
          baseColor={colors.baseColor}
          highlightColor={colors.highlightColor}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/50 dark:border-white/10">
        <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
          <thead className="bg-white/80 dark:bg-white/5">
            <tr>
              {Array.from({ length: 6 }).map((_item, index) => (
                <th key={`head-${index}`} className="px-6 py-4">
                  <Skeleton
                    width={90 + index * 8}
                    height={18}
                    borderRadius={8}
                    baseColor={colors.baseColor}
                    highlightColor={colors.highlightColor}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 bg-white/60 dark:divide-white/10 dark:bg-white/5">
            {Array.from({ length: rows }).map((_row, index) => (
              <tr key={`row-${index}`}>
                {Array.from({ length: 6 }).map((_col, colIndex) => (
                  <td key={`cell-${index}-${colIndex}`} className="px-6 py-5">
                    <Skeleton
                      width={`${60 + colIndex * 8}%`}
                      height={18}
                      borderRadius={10}
                      baseColor={colors.baseColor}
                      highlightColor={colors.highlightColor}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
