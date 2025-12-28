const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const demoSeed = process.env.DEMO_SEED || 'caliber-demo'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (or GitHub secrets).')
  process.exit(1)
}

const userClient = createClient(supabaseUrl, supabaseKey)
const adminClient = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

// Portfolio/demo seed user
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!'
}

const PROMPTS = [
  'What is the capital of France?',
  'Explain quantum computing in simple terms.',
  'Write a Python function to calculate fibonacci numbers.',
  'What are the benefits of regular exercise?',
  'Summarize the key points of climate change.',
  'How do I make chocolate chip cookies?',
  'What is the difference between React and Vue?',
  'Explain the concept of machine learning.',
  'What are the best practices for API design?',
  'How does photosynthesis work?',
  'What are the main features of TypeScript?',
  'How can I improve my productivity at work?',
  'Explain the theory of relativity in layman\'s terms.'
]

const RESPONSES = [
  'The capital of France is Paris.',
  'Quantum computing uses qubits that can represent multiple states at once, enabling certain computations to be much faster than classical computers.',
  "def fibonacci(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a",
  'Regular exercise improves cardiovascular health, strength, energy, and mood.',
  'Climate change is driven by greenhouse gas emissions, leading to warming, extreme weather, and ecosystem impacts.',
  'Mix wet ingredients, add dry ingredients, fold in chocolate chips, then bake until golden.',
  'React emphasizes component state and JSX, while Vue offers a template-first approach; both are popular UI frameworks.',
  'Machine learning is a method where models learn patterns from data to make predictions or decisions.',
  'Good API design includes consistent naming, correct HTTP semantics, pagination, auth, and clear errors.',
  'Photosynthesis converts light, water, and CO2 into glucose and oxygen.',
  'TypeScript adds static typing and tooling on top of JavaScript.',
  'Use prioritization, time-blocking, fewer context switches, and clear goals to improve productivity.',
  'Relativity describes how time and space are linked; gravity is the curvature of spacetime.'
]

function hashStringToUint32(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed) {
  let t = seed >>> 0
  return function next() {
    t += 0x6D2B79F5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

// Deterministic RNG for consistent demo charts.
// We still anchor timestamps to "today" so the window moves forward, but the shape stays consistent.
let rng = mulberry32(hashStringToUint32(demoSeed))

function reseedRngForToday() {
  const todayKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  rng = mulberry32(hashStringToUint32(`${demoSeed}:${todayKey}`))
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number))
}

function randomNormal(mean, stdDev) {
  // Box–Muller transform
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + z * stdDev
}

function generateScore(dayIndexFromOldest) {
  // Mild weekly seasonality + noise; stays mostly 70-95 with occasional dips.
  const seasonal = 3.5 * Math.sin((2 * Math.PI * dayIndexFromOldest) / 7)
  const mean = 79 + seasonal
  const score = randomNormal(mean, 7)
  return Math.round(clamp(score, 15, 98))
}

function generateLatency(dayIndexFromOldest) {
  // Slight trend/seasonality + noise
  const seasonal = 80 * Math.cos((2 * Math.PI * dayIndexFromOldest) / 10)
  const mean = 760 + seasonal
  const latency = randomNormal(mean, 260)
  return Math.round(clamp(latency, 120, 3200))
}

function generateFlags(score, latencyMs) {
  if (score < 50) return { error: true }
  if (score < 70 && Math.random() < 0.25) return { timeout: true }
  if (latencyMs > 1800 && Math.random() < 0.25) return { warning: 'slow_response' }
  return null
}

function generatePiiTokens() {
  const rand = rng()
  if (rand < 0.82) return 0
  if (rand < 0.95) return Math.floor(rng() * 3) + 1
  return Math.floor(rng() * 3) + 3
}

function utcStartOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

function randomTimestampWithinUtcDay(utcDayStart) {
  // Keep times safely inside the day to avoid timezone edge artifacts
  const minSeconds = 60 * 60 * 2 // 02:00 UTC
  const maxSeconds = 60 * 60 * 22 // 22:00 UTC
  const seconds = Math.floor(minSeconds + rng() * (maxSeconds - minSeconds))
  return new Date(utcDayStart.getTime() + seconds * 1000)
}

function computeDailyCounts(totalEvaluations, days) {
  // Goal:
  // - Clearly different dataset sizes for 7/14/30 day views
  // - More activity in recent days (portfolio looks "alive")
  // - Non-flat daily chart (seasonality + mild noise)

  // IMPORTANT: The dashboard trend chart only renders days that have at least 1 evaluation.
  // If some days have 0, you'll see fewer points (e.g. 7-day shows 2 points).
  // So we guarantee a small minimum per day and distribute the remainder.

  // For demo charts we want smooth lines, so ensure enough events per day.
  // With daily reseeds this keeps charts consistent and avoids noisy "single point" days.
  const minPerDay = totalEvaluations >= days ? 8 : 0
  const baselineTotal = minPerDay * days
  let remaining = Math.max(0, totalEvaluations - baselineTotal)

  const weights = []
  for (let offsetFromNow = days - 1; offsetFromNow >= 0; offsetFromNow--) {
    // offsetFromNow: 29 (oldest) ... 0 (today)
    const recency = Math.exp(-offsetFromNow / 9) // heavier recent
    const weekly = 1 + 0.18 * Math.sin((2 * Math.PI * (days - 1 - offsetFromNow)) / 7)
    const noise = 1 + (rng() - 0.5) * 0.06
    weights.push(Math.max(0.05, recency * weekly * noise))
  }

  const sum = weights.reduce((a, b) => a + b, 0)
  const rawCounts = weights.map(w => (sum === 0 ? 0 : (w / sum) * remaining))

  const counts = rawCounts.map(c => Math.floor(c) + minPerDay)
  let remainder = totalEvaluations - counts.reduce((a, b) => a + b, 0)

  // Distribute remainder to the most recent days
  let i = counts.length - 1
  while (remainder > 0) {
    counts[i] += 1
    remainder -= 1
    i -= 1
    if (i < 0) i = counts.length - 1
  }

  return counts
}

async function ensureTestUser() {
  console.log('🔐 Authenticating demo user...')

  // If we have the service role key, ensure the demo user exists and is confirmed.
  if (adminClient) {
    const createResult = await adminClient.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: { full_name: 'Test User' },
    })

    // Ignore "already exists" errors; we just need a user present.
    if (createResult.error) {
      const message = String(createResult.error.message || '')
      if (!message.toLowerCase().includes('already')) {
        console.error('❌ Admin createUser failed:', createResult.error.message)
        throw createResult.error
      }
    }
  }

  // Always sign in via anon key to get the user's ID (and to verify the login works for the demo).
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password
  })

  if (signInError || !signInData?.user) {
    console.error('❌ Demo sign-in failed:', signInError?.message)
    console.error('💡 If this is a fresh Supabase project, disable email confirmation OR set SUPABASE_SERVICE_ROLE_KEY so the script can confirm the user.')
    throw signInError || new Error('Demo sign-in failed')
  }

  return signInData.user
}

async function upsertUserConfig(userId) {
  const client = adminClient || userClient
  const { error } = await client
    .from('user_configs')
    .upsert(
      {
        user_id: userId,
        run_policy: 'always',
        sample_rate_pct: 100,
        obfuscate_pii: false,
        max_eval_per_day: 1000
      },
      { onConflict: 'user_id' }
    )

  if (error) throw error
}

async function deleteExistingEvaluations(userId) {
  if (!adminClient) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not set; skipping delete (data may accumulate).')
    console.log('   For daily GitHub Action reseeds, add SUPABASE_SERVICE_ROLE_KEY to secrets to make reseeding idempotent.')
    return
  }

  console.log('🧹 Clearing existing demo evaluations (service role)...')
  const { error } = await adminClient
    .from('evaluations')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}

async function seedEvaluations(userId, totalEvaluations, days) {
  console.log(`\n🌱 Seeding demo data: ${totalEvaluations} evals across ${days} days`) 

  reseedRngForToday()

  const now = new Date()
  const todayUtcStart = utcStartOfDay(now)
  const dayMs = 24 * 60 * 60 * 1000
  const oldestUtcStart = new Date(todayUtcStart.getTime() - (days - 1) * dayMs)

  console.log(`   🕒 Now (UTC):        ${now.toISOString()}`)
  console.log(`   📅 Today UTC start:  ${todayUtcStart.toISOString()}`)
  console.log(`   📅 Oldest UTC start: ${oldestUtcStart.toISOString()}`)
  const dailyCounts = computeDailyCounts(totalEvaluations, days)

  const batchSize = 100
  const buffer = []
  let inserted = 0
  let globalIndex = 0

  for (let dayIndexFromOldest = 0; dayIndexFromOldest < days; dayIndexFromOldest++) {
    const offsetFromOldest = days - 1 - dayIndexFromOldest
    const utcDayStart = new Date(todayUtcStart.getTime() - offsetFromOldest * 24 * 60 * 60 * 1000)
    const countForDay = dailyCounts[dayIndexFromOldest]

    for (let j = 0; j < countForDay; j++) {
      const promptIndex = Math.floor(rng() * PROMPTS.length)
      const score = generateScore(dayIndexFromOldest)
      const latencyMs = generateLatency(dayIndexFromOldest)

      buffer.push({
        user_id: userId,
        interaction_id: `eval-${String(globalIndex + 1).padStart(6, '0')}`,
        prompt: PROMPTS[promptIndex],
        response: RESPONSES[promptIndex],
        score: score,
        latency_ms: latencyMs,
        flags: generateFlags(score, latencyMs),
        pii_tokens_redacted: generatePiiTokens(),
        created_at: randomTimestampWithinUtcDay(utcDayStart).toISOString()
      })

      globalIndex += 1

      if (buffer.length >= batchSize) {
        const client = adminClient || userClient
        const { error } = await client.from('evaluations').insert(buffer)
        if (error) throw error
        inserted += buffer.length
        buffer.length = 0
        process.stdout.write(`\r   ⏳ Inserted ${inserted}/${totalEvaluations}`)
      }
    }
  }

  if (buffer.length > 0) {
    const client = adminClient || userClient
    const { error } = await client.from('evaluations').insert(buffer)
    if (error) throw error
    inserted += buffer.length
    process.stdout.write(`\r   ⏳ Inserted ${inserted}/${totalEvaluations}`)
  }

  console.log('\n✅ Insert complete')
}

async function sanityCheck(userId) {
  const now = new Date()
  const threshold7 = now.getTime() - 7 * 864e5
  const threshold14 = now.getTime() - 14 * 864e5
  const threshold30 = now.getTime() - 30 * 864e5

  const client = adminClient || userClient
  const qCount = async (thresholdMs) => {
    const thresholdIso = new Date(thresholdMs).toISOString()
    const { count, error } = await client
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thresholdIso)
    if (error) throw error
    return count || 0
  }

  const count7 = await qCount(threshold7)
  const count14 = await qCount(threshold14)
  const count30 = await qCount(threshold30)

  const { data: minRow, error: minErr } = await client
    .from('evaluations')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
  if (minErr) throw minErr

  const { data: maxRow, error: maxErr } = await client
    .from('evaluations')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (maxErr) throw maxErr

  console.log('\n📌 Sanity check (should be strictly increasing):')
  console.log(`   last 7 days : ${count7}`)
  console.log(`   last 14 days: ${count14}`)
  console.log(`   last 30 days: ${count30}`)
  console.log(`   min created_at: ${minRow?.[0]?.created_at}`)
  console.log(`   max created_at: ${maxRow?.[0]?.created_at}`)
}

async function main() {
  console.log('🌱 Starting demo seeding...')
  console.log('='.repeat(60))

  const user = await ensureTestUser()
  console.log(`✅ Authenticated: ${user.email}`)
  console.log(`   User ID: ${user.id}`)

  await upsertUserConfig(user.id)
  await deleteExistingEvaluations(user.id)

  const totalEvaluations = 1000
  const days = 30

  await seedEvaluations(user.id, totalEvaluations, days)
  await sanityCheck(user.id)

  console.log('='.repeat(60))
  console.log('🎉 SEED COMPLETE')
  console.log(`📧 Demo login: ${TEST_USER.email}`)
  console.log(`🔑 Password : ${TEST_USER.password}`)
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err?.message || err)
  process.exit(1)
})
