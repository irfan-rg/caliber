import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Vercel Cron Job: Keep Supabase Database Active
 * 
 * This endpoint is called daily by Vercel Cron to prevent
 * Supabase free-tier database from auto-pausing after 7 days of inactivity.
 * 
 * Configure in vercel.json with:
 * {
 *   "crons": [{
 *     "path": "/api/cron/keep-alive",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization')
    
    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production') {
      const cronSecret = process.env.CRON_SECRET
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const supabase = await createClient()
    
    // Perform a lightweight query to keep database active
    // Count total evaluations (fast query with existing index)
    const { count, error } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Keep-alive query failed:', error.message)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Log success for monitoring
    console.log(`✅ Keep-alive successful - ${count || 0} evaluations in database`)

    return NextResponse.json({
      success: true,
      message: 'Database is active',
      evaluations: count || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Keep-alive error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Optional: Allow POST for manual testing
export async function POST(request: Request) {
  return GET(request)
}
