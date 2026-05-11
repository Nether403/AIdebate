/**
 * Test script to debug debate execution
 * Run with: npx tsx scripts/test-debate-execution.ts
 */

import 'dotenv/config'
import { executeDebate } from '@/lib/debate/executor'

const debateId = process.argv[2]

if (!debateId) {
  console.error('Usage: npx tsx scripts/test-debate-execution.ts <debate-id>')
  process.exit(1)
}

console.log(`Testing debate execution for: ${debateId}`)
console.log('---')

executeDebate(debateId)
  .then(() => {
    console.log('---')
    console.log('✅ Debate execution completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.log('---')
    console.error('❌ Debate execution failed!')
    console.error(error)
    process.exit(1)
  })
