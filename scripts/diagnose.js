const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'Test123!'

async function diagnose() {
  console.log('🔍 PRODUCTION DATA DIAGNOSTIC TOOL\n')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Try to authenticate
    console.log('\n📝 Step 1: Authenticating...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
    
    if (authError || !authData?.user) {
      console.log('   ❌ Authentication failed:', authError?.message)
      console.log('\n   💡 Solution: User doesn\'t exist or wrong credentials')
      console.log('      Run: node scripts/seed-fixed.js')
      return
    }
    
    const user = authData.user
    console.log('   ✅ Authentication successful')
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   🆔 User ID: ${user.id}`)
    
    // Step 2: Check evaluations with RLS
    console.log('\n📝 Step 2: Checking evaluations (with RLS)...')
    const { data: evals, error: evalsError, count: evalsCount } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .limit(5)
    
    if (evalsError) {
      console.log('   ❌ Query failed:', evalsError.message)
      console.log('\n   💡 Possible RLS policy issue')
      return
    }
    
    console.log(`   ✅ Query successful`)
    console.log(`   📊 Total evaluations: ${evalsCount || 0}`)
    
    if (!evals || evals.length === 0) {
      console.log('   ⚠️  NO EVALUATIONS FOUND!')
      console.log('\n   🔍 Checking if data exists with different user_id...')
      
      // This won't work with RLS, but worth documenting
      console.log('   ℹ️  Cannot query other users\' data due to RLS (this is good!)')
      console.log('\n   💡 Solutions:')
      console.log('      A) Run seed script: node scripts/seed-fixed.js')
      console.log('      B) Or in Supabase SQL Editor, run:')
      console.log(`         SELECT COUNT(*) FROM evaluations;`)
      console.log(`         SELECT DISTINCT user_id FROM evaluations;`)
      console.log(`         -- If data exists with different user_id, update it:`)
      console.log(`         UPDATE evaluations SET user_id = '${user.id}';`)
      return
    }
    
    console.log(`   ✅ Sample evaluation:`)
    console.log(`      Interaction: ${evals[0].interaction_id}`)
    console.log(`      Score: ${evals[0].score}`)
    console.log(`      Latency: ${evals[0].latency_ms}ms`)
    console.log(`      Created: ${new Date(evals[0].created_at).toLocaleString()}`)
    
    // Step 3: Check config
    console.log('\n📝 Step 3: Checking user config...')
    const { data: config, error: configError } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (configError) {
      console.log('   ❌ Config query failed:', configError.message)
    } else if (!config) {
      console.log('   ⚠️  No config found')
      console.log('   💡 Run: node scripts/seed-fixed.js')
    } else {
      console.log('   ✅ Config exists')
      console.log(`      Run Policy: ${config.run_policy}`)
      console.log(`      Sample Rate: ${config.sample_rate_pct}%`)
    }
    
    // Step 4: Test API endpoints
    console.log('\n📝 Step 4: Testing API endpoints...')
    
    // Note: This only works if server is running
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      console.log(`   ℹ️  Testing: ${apiUrl}/api/evals/stats?days=7`)
      
      const response = await fetch(`${apiUrl}/api/evals/stats?days=7`, {
        headers: {
          'Authorization': `Bearer ${authData.session?.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ API endpoint working')
        console.log(`      Total Evals: ${data.data?.totalEvals || 0}`)
        console.log(`      Avg Score: ${data.data?.avgScore || 0}`)
      } else {
        console.log(`   ⚠️  API returned: ${response.status}`)
        console.log('   ℹ️  This is OK if dev server is not running')
      }
    } catch (apiError) {
      console.log('   ℹ️  Could not test API (server might not be running)')
    }
    
    // Step 5: Calculate statistics
    if (evals && evals.length > 0) {
      console.log('\n📝 Step 5: Statistics Summary...')
      const { data: allEvals } = await supabase
        .from('evaluations')
        .select('score, latency_ms, pii_tokens_redacted')
        .eq('user_id', user.id)
      
      if (allEvals && allEvals.length > 0) {
        const total = allEvals.length
        const avgScore = (allEvals.reduce((sum, e) => sum + e.score, 0) / total).toFixed(2)
        const avgLatency = (allEvals.reduce((sum, e) => sum + e.latency_ms, 0) / total).toFixed(0)
        const successRate = ((allEvals.filter(e => e.score >= 70).length / total) * 100).toFixed(1)
        
        console.log(`   ✅ Total Evaluations: ${total}`)
        console.log(`   📊 Average Score: ${avgScore}`)
        console.log(`   ⏱️  Average Latency: ${avgLatency}ms`)
        console.log(`   🎯 Success Rate: ${successRate}%`)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ DIAGNOSIS COMPLETE!\n')
    
    if (evalsCount && evalsCount > 0) {
      console.log('🎉 Everything looks good!')
      console.log('   Your data should appear in the dashboard.')
      console.log('   If not, check browser console for errors.')
    } else {
      console.log('⚠️  NO DATA FOUND')
      console.log('   Solution: Run node scripts/seed-fixed.js')
    }
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Diagnostic error:', error.message)
    console.error(error)
  }
}

diagnose()
