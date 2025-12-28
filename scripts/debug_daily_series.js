const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const client = createClient(url, anon)

function startUtcForDays(days) {
  const startUtc = new Date()
  startUtc.setUTCHours(0, 0, 0, 0)
  startUtc.setUTCDate(startUtc.getUTCDate() - (days - 1))
  return startUtc
}

async function main() {
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'Test123!',
  })
  if (authError) throw authError
  const userId = authData.user.id

  const days = 30
  const startUtc = startUtcForDays(days)

  const { data: rows, error: rowsError } = await client
    .from('evaluations')
    .select('created_at,score,latency_ms')
    .eq('user_id', userId)
    .gte('created_at', startUtc.toISOString())
    .order('created_at', { ascending: true })

  if (rowsError) throw rowsError

  const byDay = new Map()
  for (const r of rows) {
    const key = r.created_at.slice(0, 10)
    const existing = byDay.get(key) || { count: 0, totalScore: 0, totalLatency: 0 }
    existing.count += 1
    existing.totalScore += r.score
    existing.totalLatency += r.latency_ms
    byDay.set(key, existing)
  }

  const series = []
  for (let i = 0; i < days; i++) {
    const day = new Date(startUtc)
    day.setUTCDate(startUtc.getUTCDate() + i)
    const key = day.toISOString().slice(0, 10)
    const d = byDay.get(key)
    series.push({
      date: key,
      count: d?.count || 0,
      avgScore: d?.count ? Math.round((d.totalScore / d.count) * 10) / 10 : 0,
      avgLatency: d?.count ? Math.round(d.totalLatency / d.count) : 0,
    })
  }

  const zeroDays = series.filter((x) => x.count === 0).map((x) => x.date)

  console.log('startUtc:', startUtc.toISOString())
  console.log('rowsReturned:', rows.length)
  console.log('zeroDays:', zeroDays.length)
  console.log('first5:', series.slice(0, 5))
  console.log('last5:', series.slice(-5))
  if (zeroDays.length) {
    console.log('zeroDayList:', zeroDays)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
