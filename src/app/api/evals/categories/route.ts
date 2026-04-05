import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/types'

type EvaluationRow = Pick<
  Database['public']['Tables']['evaluations']['Row'],
  'score' | 'flags'
>

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

function deriveCategories(flags: Json | null): string[] {
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
    return ['No Flags']
  }

  const entries = Object.entries(flags as Record<string, Json | undefined>)
  if (entries.length === 0) {
    return ['No Flags']
  }

  const categories = new Set<string>()

  for (const [key, value] of entries) {
    if (value === false || value === null || value === undefined) {
      continue
    }

    if (key === 'warning' && typeof value === 'string' && value.length > 0) {
      categories.add(formatCategoryName(value))
      continue
    }

    categories.add(formatCategoryName(key))
  }

  if (categories.size === 0) {
    return ['No Flags']
  }

  return Array.from(categories)
}

// GET /api/evals/categories - Get score totals grouped by category for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedDays = Number.parseInt(searchParams.get('days') || '7', 10)
    const days = Number.isFinite(parsedDays) && parsedDays > 0
      ? Math.min(parsedDays, 365)
      : 7

    const startUtc = new Date()
    startUtc.setUTCHours(0, 0, 0, 0)
    startUtc.setUTCDate(startUtc.getUTCDate() - (days - 1))

    const categoryMap = new Map<string, CategoryTotals>()
    const pageSize = 1000

    for (let offset = 0; offset < 100000; offset += pageSize) {
      const { data: page, error } = await supabase
        .from('evaluations')
        .select('score, flags')
        .eq('user_id', user.id)
        .gte('created_at', startUtc.toISOString())
        .range(offset, offset + pageSize - 1)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!page || page.length === 0) {
        break
      }

      for (const evaluation of page as EvaluationRow[]) {
        const categories = deriveCategories(evaluation.flags)

        for (const category of categories) {
          const existing = categoryMap.get(category) || { totalScore: 0, evaluations: 0 }
          categoryMap.set(category, {
            totalScore: existing.totalScore + evaluation.score,
            evaluations: existing.evaluations + 1,
          })
        }
      }

      if (page.length < pageSize) {
        break
      }
    }

    const data = Array.from(categoryMap.entries())
      .map(([category, totals]) => ({
        category,
        totalScore: Number(totals.totalScore.toFixed(1)),
        evaluations: totals.evaluations,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)

    const response = NextResponse.json({ data })
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

    return response
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}