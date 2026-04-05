import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/types'

type Evaluation = Database['public']['Tables']['evaluations']['Row']

interface CategoryTotals {
  totalScore: number
  evaluations: number
}

function formatCategoryName(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function deriveCategory(flags: Json | null) {
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
    return 'No Flags'
  }

  const record = flags as Record<string, Json | undefined>

  const typeValue = record.type
  if (typeof typeValue === 'string' && typeValue.trim().length > 0) {
    return formatCategoryName(typeValue)
  }

  if (record.error === true) return 'Error'
  if (record.timeout === true) return 'Timeout'

  const warning = record.warning
  if (typeof warning === 'string' && warning.trim().length > 0) {
    return formatCategoryName(warning)
  }

  for (const [key, value] of Object.entries(record)) {
    if (value === false || value === null || value === undefined) continue
    return formatCategoryName(key)
  }

  return 'No Flags'
}

// GET /api/evals/stats - Get evaluation statistics for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get days parameter (default 7)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const toIsoDate = (date: Date) => date.toISOString().split('T')[0]
    const dateKeyFromCreatedAt = (createdAt: string) => createdAt.slice(0, 10)

    // Calculate date threshold (UTC, start-of-day) so "7 days" returns exactly 7 daily points.
    const startUtc = new Date()
    startUtc.setUTCHours(0, 0, 0, 0)
    startUtc.setUTCDate(startUtc.getUTCDate() - (days - 1))

    // NOTE: Supabase/PostgREST responses are effectively capped per request.
    // If you have >~1000 evals in the window, a single select() will truncate,
    // which makes many days look like "0" and breaks the chart.
    // So we paginate and aggregate incrementally.

    const pageSize = 1000
    let total = 0
    let totalScore = 0
    let totalLatency = 0
    let successCount = 0
    let totalPiiRedacted = 0

    const scoreDistribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    }

    const categoryMap = new Map<string, CategoryTotals>()

    // Calculate daily trends (always return exactly `days` points)
    const dailyMap = new Map<string, { count: number; totalScore: number; totalLatency: number }>()

    for (let offset = 0; offset < 100000; offset += pageSize) {
      const { data: page, error } = await supabase
        .from('evaluations')
        .select('created_at, score, latency_ms, pii_tokens_redacted, flags')
        .eq('user_id', user.id)
        .gte('created_at', startUtc.toISOString())
        .order('created_at', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!page || page.length === 0) break

      for (const e of page as Pick<Evaluation, 'created_at' | 'score' | 'latency_ms' | 'pii_tokens_redacted' | 'flags'>[]) {
        total += 1
        totalScore += e.score
        totalLatency += e.latency_ms
        if (e.score >= 70) successCount += 1
        totalPiiRedacted += e.pii_tokens_redacted || 0

        const category = deriveCategory(e.flags)
        const existingCategory = categoryMap.get(category) || { totalScore: 0, evaluations: 0 }
        categoryMap.set(category, {
          totalScore: existingCategory.totalScore + e.score,
          evaluations: existingCategory.evaluations + 1,
        })

        if (e.score >= 90) scoreDistribution.excellent += 1
        else if (e.score >= 70) scoreDistribution.good += 1
        else if (e.score >= 50) scoreDistribution.fair += 1
        else scoreDistribution.poor += 1

        const dateKey = dateKeyFromCreatedAt(e.created_at)
        const existing = dailyMap.get(dateKey) || { count: 0, totalScore: 0, totalLatency: 0 }
        dailyMap.set(dateKey, {
          count: existing.count + 1,
          totalScore: existing.totalScore + e.score,
          totalLatency: existing.totalLatency + e.latency_ms,
        })
      }

      if (page.length < pageSize) break
    }

    const avgScore = total > 0 ? totalScore / total : 0
    const avgLatency = total > 0 ? totalLatency / total : 0
    const successRate = total > 0 ? (successCount / total) * 100 : 0

    const dailyTrends = Array.from({ length: days }).map((_, idx) => {
      const day = new Date(startUtc)
      day.setUTCDate(startUtc.getUTCDate() + idx)
      const date = toIsoDate(day)
      const data = dailyMap.get(date)

      if (!data || data.count === 0) {
        return {
          date,
          count: 0,
          avgScore: 0,
          avgLatency: 0,
        }
      }

      return {
        date,
        count: data.count,
        avgScore: parseFloat((data.totalScore / data.count).toFixed(1)),
        avgLatency: Math.round(data.totalLatency / data.count),
      }
    })

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, totals]) => ({
        category,
        totalScore: Number(totals.totalScore.toFixed(1)),
        evaluations: totals.evaluations,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)

    const response = NextResponse.json({
      data: {
        totalEvals: total,
        avgScore: parseFloat(avgScore.toFixed(1)),
        avgLatency: parseFloat(avgLatency.toFixed(0)),
        successRate: parseFloat(successRate.toFixed(1)),
        totalPiiRedacted,
        dailyTrends,
        categoryBreakdown,
        scoreDistribution,
      },
    })
    
    // Add caching headers for stats (can cache longer since they don't change frequently)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
