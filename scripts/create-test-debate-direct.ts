/**
 * Create a test debate directly (bypasses API rate limits)
 */
import 'dotenv/config'
import { createDebateEngine } from '@/lib/debate/engine'
import { validateDebateConfig } from '@/lib/debate/config'
import { executeDebate } from '@/lib/debate/executor'

async function main() {
  const configInput = {
    proModelId: '1d369e36-337a-4689-a0dc-2aa53136aa7d', // GPT-4o-mini
    conModelId: 'dff491cf-92ca-43bf-8c74-cf4fb86d6400', // Gemini 3 Pro Preview
    topicSelection: 'random' as const,
    totalRounds: 1,
    wordLimitPerTurn: 500,
    factCheckMode: 'standard' as const,
  }
  
  console.log('Creating debate with config:', configInput)
  
  // Validate configuration
  const validation = validateDebateConfig(configInput)
  if (!validation.valid || !validation.data) {
    console.error('Invalid config:', validation.errors)
    process.exit(1)
  }
  
  // Create debate
  const engine = createDebateEngine()
  const session = await engine.initializeDebate(validation.data)
  
  console.log('\n✅ Debate created:', session.id)
  console.log('Topic:', session.state.topicMotion)
  console.log('Fact-checking:', session.state.factCheckMode)
  
  // Start debate
  await engine.startDebate(session.id)
  
  // Execute debate
  console.log('\n🚀 Starting debate execution...\n')
  await executeDebate(session.id)
  
  console.log('\n✅ Debate completed!')
  console.log('\nTo view results, run:')
  console.log(`npx tsx scripts/check-debate.ts ${session.id}`)
}

main().catch(console.error)
