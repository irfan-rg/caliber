import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/types'

type Evaluation = Database['public']['Tables']['evaluations']['Row']

function formatCategoryName(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function deriveCategory(flags: Json | null): string {
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
    if (value === false || value === null || value === undefined) {
      continue
    }

    return formatCategoryName(key)
  }

  return 'No Flags'
}

function toCategoryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'no_flags'
}

function normalizeSearchTerm(value: string) {
  return value.replace(/[%_,]/g, '').trim()
}

type FilterQuery<T> = {
  eq: (column: string, value: string) => T
  gte: (column: string, value: string) => T
  lte: (column: string, value: string) => T
  or: (filters: string) => T
}

function mapEvaluationWithCategory(row: Evaluation) {
  const category = deriveCategory(row.flags)

  return {
    ...row,
    category,
    category_key: toCategoryKey(category),
    amount: row.score,
  }
}

// GET /api/evals - List all evaluations for the current user with pagination
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const query = normalizeSearchTerm(searchParams.get('q') || '')
    const categoryFilter = (searchParams.get('category') || 'all').toLowerCase()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const applyBaseFilters = <T extends FilterQuery<T>>(queryBuilder: T): T => {
      let next = queryBuilder.eq('user_id', user.id)

      if (startDate) {
        next = next.gte('created_at', `${startDate}T00:00:00.000Z`)
      }

      if (endDate) {
        next = next.lte('created_at', `${endDate}T23:59:59.999Z`)
      }

      if (query) {
        const searchFilter = `interaction_id.ilike.%${query}%,prompt.ilike.%${query}%,response.ilike.%${query}%`
        next = next.or(searchFilter)
      }

      return next
    }

    if (categoryFilter !== 'all') {
      const pageSize = 1000
      const allRows: Evaluation[] = []

      for (let rangeStart = 0; rangeStart < 100000; rangeStart += pageSize) {
        const queryBuilder = applyBaseFilters(
          supabase
            .from('evaluations')
            .select('*')
        )

        const { data, error } = await queryBuilder
          .order('created_at', { ascending: false })
          .range(rangeStart, rangeStart + pageSize - 1)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!data || data.length === 0) {
          break
        }

        allRows.push(...(data as Evaluation[]))

        if (data.length < pageSize) {
          break
        }
      }

      const filteredRows = allRows.filter((row) => {
        const category = deriveCategory(row.flags)
        return toCategoryKey(category) === categoryFilter
      })

      const total = filteredRows.length
      const pagedRows = filteredRows.slice(offset, offset + limit)
      const totalPages = Math.max(1, Math.ceil(total / limit))

      const response = NextResponse.json({
        data: pagedRows.map(mapEvaluationWithCategory),
        total,
        page,
        limit,
        totalPages,
      })

      response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
      return response
    }

    // Get total count
    const countQuery = applyBaseFilters(
      supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
    )

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Get paginated data
    const dataQuery = applyBaseFilters(
      supabase
        .from('evaluations')
        .select('*')
    )

    const { data, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    const response = NextResponse.json({ 
      data: (data as Evaluation[] | null)?.map(mapEvaluationWithCategory) || [],
      total: count || 0,
      page,
      limit,
      totalPages
    })
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    
    return response
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
