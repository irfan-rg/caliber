// Generate timestamp - ALWAYS within last 7 days for testing
function generateTimestamp() {
  const now = new Date()
  // Generate data spread across the last 7 days
  // More data in recent days (exponential distribution)
  const daysAgo = Math.pow(Math.random(), 2) * 7 // 0-7 days ago, biased towards recent
  const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000)
  return timestamp.toISOString()
}

// Generate timestamp for 30-day view testing
function generateTimestamp30Days() {
  const now = new Date()
  const daysAgo = Math.pow(Math.random(), 2) * 30 // 0-30 days ago
  const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000)
  return timestamp.toISOString()
}

// For the seed script, you can split the data:
// - 70% of evaluations in last 7 days (for 7-day view)
// - 30% of evaluations spread across 8-30 days ago (for 30-day view)

async function generateEvaluations(userId, count) {
  console.log(`\n📊 Generating ${count} evaluation records...`)
  console.log(`   Using User ID: ${userId}`)
  
  const evaluations = []
  const batchSize = 50
  let created = 0
  
  // 70% recent (last 7 days), 30% older (8-30 days ago)
  const recentCount = Math.floor(count * 0.7)

  for (let i = 0; i < count; i++) {
    const promptIndex = Math.floor(Math.random() * PROMPTS.length)
    const score = generateScore()
    
    evaluations.push({
      user_id: userId,
      interaction_id: `eval-${String(i + 1).padStart(6, '0')}`,
      prompt: PROMPTS[promptIndex],
      response: RESPONSES[promptIndex],
      score: score,
      latency_ms: generateLatency(),
      flags: generateFlags(score),
      pii_tokens_redacted: generatePiiTokens(),
      // Use generateTimestamp() for recent data, generateTimestamp30Days() for older
      created_at: i < recentCount ? generateTimestamp() : generateTimestamp30Days()
    })

    // ... rest of batch insertion logic
  }
}
