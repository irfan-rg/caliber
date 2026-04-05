'use client'

import Skeleton from 'react-loading-skeleton'
import { motion } from 'framer-motion'

const baseColorLight = 'rgba(0, 0, 0, 0.06)'
const highlightColorLight = 'rgba(0, 0, 0, 0.12)'
const baseColorDark = 'rgba(255, 255, 255, 0.08)'
const highlightColorDark = 'rgba(255, 255, 255, 0.18)'


import { useEffect, useState } from 'react'

function getInitialSkeletonPalette() {
  // Always return light on SSR for deterministic output
  return {
    baseColor: baseColorLight,
    highlightColor: highlightColorLight,
  }
}

function getClientSkeletonPalette() {
  if (typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark
      ? { baseColor: baseColorDark, highlightColor: highlightColorDark }
      : { baseColor: baseColorLight, highlightColor: highlightColorLight }
  }
  return getInitialSkeletonPalette()
}


export function StatCardSkeleton({ fast = false }: { fast?: boolean }) {
  const [palette, setPalette] = useState(getInitialSkeletonPalette())

  useEffect(() => {
    setPalette(getClientSkeletonPalette())
  }, [])

  return (
    <motion.div
      className="glass-card flex flex-col justify-between rounded-3xl p-5"
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: fast ? 0.06 : 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between">
        <Skeleton
          width={36}
          height={36}
          borderRadius={12}
          baseColor={palette.baseColor}
          highlightColor={palette.highlightColor}
        />
        <Skeleton
          width={48}
          height={18}
          borderRadius={999}
          baseColor={palette.baseColor}
          highlightColor={palette.highlightColor}
        />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton
          width="70%"
          height={18}
          borderRadius={8}
          baseColor={palette.baseColor}
          highlightColor={palette.highlightColor}
        />
        <Skeleton
          width="55%"
          height={28}
          borderRadius={12}
          baseColor={palette.baseColor}
          highlightColor={palette.highlightColor}
        />
      </div>
    </motion.div>
  )
}

export function StatCardSkeletonGrid({ count = 4, fast = false }: { count?: number; fast?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_item, index) => (
        <StatCardSkeleton key={`stat-skeleton-${index}`} fast={fast} />
      ))}
    </div>
  )
}
