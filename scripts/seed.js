const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!'
}

// Realistic AI prompts
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
  'What is the meaning of life according to philosophy?',
  'Describe the water cycle in nature.',
  'What are the main features of TypeScript?',
  'How can I improve my productivity at work?',
  'Explain the theory of relativity in layman\'s terms.'
]

// Corresponding responses
const RESPONSES = [
  'The capital of France is Paris, which is located in the north-central part of the country.',
  'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, allowing for parallel processing of information at scales impossible for classical computers.',
  'Here\'s a Python function:\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
  'Regular exercise improves cardiovascular health, strengthens muscles, boosts mental health, helps maintain healthy weight, and increases energy levels.',
  'Climate change involves rising global temperatures, melting ice caps, extreme weather events, and impacts on ecosystems. It\'s primarily driven by human activities releasing greenhouse gases.',
  'To make chocolate chip cookies: Mix butter, sugar, eggs, and vanilla. Add flour, baking soda, and salt. Fold in chocolate chips. Bake at 375°F for 10-12 minutes.',
  'React uses a virtual DOM and JSX syntax, while Vue has a template-based approach. React has a larger ecosystem, while Vue is often considered easier to learn for beginners.',
  'Machine learning is a subset of AI where computers learn from data patterns without explicit programming. Models improve through experience, making predictions or decisions based on input data.',
  'API best practices include: RESTful design, proper HTTP methods, versioning, authentication, rate limiting, clear documentation, consistent naming, and comprehensive error handling.',
  'Photosynthesis is the process where plants convert light energy into chemical energy. Chlorophyll absorbs sunlight, and plants use CO2 and water to produce glucose and oxygen.',
  'Philosophers have debated this for millennia. Perspectives range from finding purpose through relationships and experiences, to existentialist views that we create our own meaning.',
  'The water cycle involves evaporation from oceans and lakes, condensation into clouds, precipitation as rain or snow, and collection back into bodies of water. This cycle continuously recycles Earth\'s water.',
  'TypeScript adds static typing to JavaScript, providing better IDE support, compile-time error checking, interfaces, generics, and improved code documentation through type annotations.',
  'Productivity tips: prioritize tasks, use time-blocking, minimize distractions, take regular breaks, set clear goals, delegate when possible, and maintain work-life balance.',
  'Einstein\'s theory states that space and time are interconnected as spacetime. Massive objects curve spacetime, and this curvature is what we experience as gravity. Time also runs slower in stronger gravitational fields.'
]

// Generate random score with realistic distribution
function generateScore() {
  const rand = Math.random()
  if (rand < 0.05) {
    // 5% failures (20-60)
    return Math.floor(Math.random() * 41) + 20
  } else if (rand < 0.15) {
    // 10% marginal (60-70)
    return Math.floor(Math.random() * 11) + 60
  } else {
    // 85% good scores (70-95)
    return Math.floor(Math.random() * 26) + 70
  }
}

// Generate random latency with realistic distribution
function generateLatency() {
  const rand = Math.random()
  if (rand < 0.7) {
    // 70% fast responses (200-800ms)
    return Math.floor(Math.random() * 600) + 200
  } else if (rand < 0.95) {
    // 25% medium responses (800-1500ms)
    return Math.floor(Math.random() * 700) + 800
  } else {
    // 5% slow responses (1500-3000ms)
    return Math.floor(Math.random() * 1500) + 1500
  }
}

// Generate flags
function generateFlags(score) {
  if (score < 50 && Math.random() < 0.5) {
    return { error: true }
  } else if (score < 70 && Math.random() < 0.3) {
    return { timeout: true }
  } else if (Math.random() < 0.1) {
    return { warning: 'slow_response' }
  }
  return null
}

// Generate PII tokens redacted
function generatePiiTokens() {
  const rand = Math.random()
  if (rand < 0.8) {
    return 0
  } else if (rand < 0.95) {
    return Math.floor(Math.random() * 3) + 1 // 1-3
  } else {
    return Math.floor(Math.random() * 3) + 3 // 3-5
  }
}

// Generate timestamp - SMART DISTRIBUTION across all time ranges
// 50% in last 7 days, 25% in 7-14 days, 25% in 14-30 days
// This ensures 7-day, 14-day, and 30-day views ALL have data
function generateTimestamp(index, total) {
  const now = new Date()
  const rand = Math.random()
  
  let daysAgo
  if (rand < 0.5) {
    // 50% within last 7 days (ensures 7-day view always has data)
    daysAgo = Math.random() * 7
  } else if (rand < 0.75) {
    // 25% within 7-14 days (ensures 14-day view has data)
    daysAgo = 7 + Math.random() * 7
  } else {
    // 25% within 14-30 days (ensures 30-day view has data)
    daysAgo = 14 + Math.random() * 16
  }
  
  const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000)
  return timestamp.toISOString()
}

// ============ IMPROVED USER AUTHENTICATION ============

async function ensureTestUserAuthenticated() {
  console.log('🔍 Authenticating test user...')
  
  try {
    // First, try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    })

    if (signInData?.user) {
      console.log('✅ Successfully authenticated!')
      console.log(`   Email: ${signInData.user.email}`)
      console.log(`   User ID: ${signInData.user.id}`)
      return signInData.user
    }

    // If sign in failed, try to create the user
    if (signInError) {
      console.log('📝 User not found, creating new test user...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER.email,
        password: TEST_USER.password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (signUpError) {
        console.error('\n❌ Could not create user:', signUpError.message)
        console.error('\n💡 Make sure:')
        console.error('   1. Email confirmation is disabled in Supabase (Authentication > Settings)')
        console.error('   2. The email format is valid')
        console.error('   3. Password meets requirements (min 6 characters)')
        throw signUpError
      }

      if (signUpData?.user) {
        console.log('✅ Test user created successfully!')
        
        // Sign in immediately with the new user
        const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
          email: TEST_USER.email,
          password: TEST_USER.password
        })

        if (newSignInError || !newSignInData?.user) {
          console.error('⚠️  User created but auto sign-in failed.')
          console.error('   Please run the script again.')
          throw new Error('User created, please run script again')
        }

        console.log('✅ Authenticated with new user!')
        console.log(`   User ID: ${newSignInData.user.id}`)
        return newSignInData.user
      }
    }

    throw new Error('Failed to authenticate user')
  } catch (error) {
    throw error
  }
}

// ============ VERIFY RLS ACCESS ============

async function verifyRLSAccess(userId) {
  console.log('\n🔍 Verifying RLS access...')
  
  try {
    // Test if we can query evaluations
    const { data, error } = await supabase
      .from('evaluations')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log(`   ⚠️  RLS query test failed: ${error.message}`)
      console.log('   This might be expected if no data exists yet.')
      return false
    }
    
    console.log('   ✅ RLS policies working correctly')
    return true
  } catch (error) {
    console.log(`   ⚠️  RLS verification error: ${error.message}`)
    return false
  }
}

// ============ CHECK FOR EXISTING DATA ============

async function checkExistingData(userId) {
  console.log('\n🔍 Checking for existing data...')
  
  try {
    const { data: evals, error: evalsError } = await supabase
      .from('evaluations')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    if (evalsError) {
      console.log('   ⚠️  Could not check existing evaluations')
      return false
    }
    
    if (evals && evals.length > 0) {
      console.log('   ⚠️  Found existing evaluations for this user!')
      return true
    }
    
    console.log('   ✅ No existing data found')
    return false
  } catch (error) {
    console.log(`   ⚠️  Error checking data: ${error.message}`)
    return false
  }
}

// ============ CLEANUP EXISTING DATA ============

async function cleanupExistingData(userId) {
  console.log('\n🧹 Cleaning up existing data...')
  
  try {
    // Delete evaluations
    const { error: evalsError } = await supabase
      .from('evaluations')
      .delete()
      .eq('user_id', userId)
    
    if (evalsError) {
      console.log(`   ⚠️  Could not delete evaluations: ${evalsError.message}`)
    } else {
      console.log('   ✅ Deleted existing evaluations')
    }
    
    // Delete config
    const { error: configError } = await supabase
      .from('user_configs')
      .delete()
      .eq('user_id', userId)
    
    if (configError) {
      console.log(`   ⚠️  Could not delete config: ${configError.message}`)
    } else {
      console.log('   ✅ Deleted existing config')
    }
    
    return true
  } catch (error) {
    console.error(`   ❌ Cleanup error: ${error.message}`)
    return false
  }
}

// Insert default config
async function ensureConfig(userId) {
  console.log('\n🔍 Setting up user config...')

  try {
    // Check if config exists
    const { data: existingConfig, error: fetchError } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingConfig) {
      console.log('   ✅ Config already exists')
      return existingConfig
    }

    // Create default config
    console.log('   📝 Creating default config...')
    const { data: newConfig, error: insertError } = await supabase
      .from('user_configs')
      .insert({
        user_id: userId,
        run_policy: 'always',
        sample_rate_pct: 100,
        obfuscate_pii: false,
        max_eval_per_day: 1000
      })
      .select()
      .single()

    if (insertError) {
      console.error(`   ❌ Error creating config: ${insertError.message}`)
      throw insertError
    }

    console.log('   ✅ Config created successfully')
    return newConfig
  } catch (error) {
    console.error(`   ❌ Error with config: ${error.message}`)
    throw error
  }
}

// Generate evaluation records
async function generateEvaluations(userId, count) {
  console.log(`\n📊 Generating ${count} evaluation records...`)
  console.log(`   Using User ID: ${userId}`)
  console.log(`   📅 70% in last 7 days, 30% in 8-30 days ago`)
  
  const evaluations = []
  const batchSize = 50
  let created = 0
  
  for (let i = 0; i < count; i++) {
    const promptIndex = Math.floor(Math.random() * PROMPTS.length)
    const score = generateScore()
    
    evaluations.push({
      user_id: userId, // ✅ Using authenticated user's ID
      interaction_id: `eval-${String(i + 1).padStart(6, '0')}`,
      prompt: PROMPTS[promptIndex],
      response: RESPONSES[promptIndex],
      score: score,
      latency_ms: generateLatency(),
      flags: generateFlags(score),
      pii_tokens_redacted: generatePiiTokens(),
      created_at: generateTimestamp(i, count) // Smart distribution
    })

    // Insert in batches
    if (evaluations.length >= batchSize || i === count - 1) {
      try {
        const { error } = await supabase
          .from('evaluations')
          .insert(evaluations)

        if (error) {
          console.error(`\n   ❌ Error inserting batch: ${error.message}`)
          console.error(`   Hint: Check RLS policies and user authentication`)
          throw error
        }

        created += evaluations.length
        const progress = Math.round((created / count) * 100)
        process.stdout.write(`\r   ⏳ Progress: ${progress}% (${created}/${count})`)
        
        evaluations.length = 0 // Clear array
      } catch (error) {
        console.error('\n   ❌ Failed to insert batch:', error.message)
        throw error
      }
    }
  }

  console.log('\n   ✅ All evaluations created!')
  return created
}

// Get statistics
async function getStatistics(userId) {
  console.log('\n📈 Verifying data with statistics...')

  try {
    const { data, error } = await supabase
      .from('evaluations')
      .select('score, latency_ms, pii_tokens_redacted')
      .eq('user_id', userId)

    if (error) {
      console.error(`   ❌ Error fetching stats: ${error.message}`)
      throw error
    }

    if (!data || data.length === 0) {
      console.log('   ⚠️  No evaluations found!')
      console.log('   This might indicate an RLS issue.')
      return null
    }

    const total = data.length
    const avgScore = (data.reduce((sum, e) => sum + e.score, 0) / total).toFixed(2)
    const avgLatency = (data.reduce((sum, e) => sum + e.latency_ms, 0) / total).toFixed(0)
    const successRate = ((data.filter(e => e.score >= 70).length / total) * 100).toFixed(1)
    const totalPii = data.reduce((sum, e) => sum + (e.pii_tokens_redacted || 0), 0)

    return {
      total,
      avgScore,
      avgLatency,
      successRate,
      totalPii
    }
  } catch (error) {
    console.error(`   ❌ Error calculating statistics: ${error.message}`)
    return null
  }
}

// Main function
async function main() {
  console.log('🌱 Starting IMPROVED database seeding process...\n')
  console.log('=' .repeat(60))

  let user

  try {
    // Step 1: Ensure test user is authenticated
    user = await ensureTestUserAuthenticated()
    
    if (!user) {
      throw new Error('Failed to authenticate user')
    }

    // Step 2: Verify RLS access
    await verifyRLSAccess(user.id)

    // Step 3: Check for existing data
    const hasExistingData = await checkExistingData(user.id)
    
    if (hasExistingData) {
      console.log('\n⚠️  EXISTING DATA DETECTED!')
      console.log('   Options:')
      console.log('   1. Ctrl+C to cancel and keep existing data')
      console.log('   2. Wait 5 seconds to DELETE existing data and reseed\n')
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      await cleanupExistingData(user.id)
    }

    // Step 4: Ensure config exists
    await ensureConfig(user.id)

    // Step 5: Generate evaluations
    const count = Math.floor(Math.random() * 501) + 500 // 500-1000
    await generateEvaluations(user.id, count)

    // Step 6: Verify with statistics
    const stats = await getStatistics(user.id)

    if (!stats) {
      throw new Error('Failed to retrieve statistics - possible RLS issue!')
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 SEEDING COMPLETE!\n')
    console.log(`📧 User: ${TEST_USER.email}`)
    console.log(`📝 Password: ${TEST_USER.password}`)
    console.log(`🆔 User ID: ${user.id}`)
    console.log(`\n📊 Summary:`)
    console.log(`   Total Evaluations: ${stats.total}`)
    console.log(`   Average Score: ${stats.avgScore}`)
    console.log(`   Average Latency: ${stats.avgLatency}ms`)
    console.log(`   Success Rate: ${stats.successRate}%`)
    console.log(`   PII Tokens Redacted: ${stats.totalPii}`)
    console.log('\n✅ Data is properly associated with your authenticated user!')
    console.log('✅ RLS policies verified - data should appear in dashboard!')
    console.log('\n🚀 You can now log in and view the dashboard!')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message)
    if (user) {
      console.error(`\n💡 Debug info:`)
      console.error(`   User ID: ${user.id}`)
      console.error(`   Email: ${user.email}`)
    }
    console.error('\n📝 Troubleshooting:')
    console.error('   1. Check RLS policies in Supabase')
    console.error('   2. Verify email confirmation is disabled')
    console.error('   3. Check if user can authenticate')
    process.exit(1)
  }
}

// Run the script
main()
