/**
 * Test Runner for Prediction Market
 * 
 * Run with: npx tsx lib/prediction/__tests__/run-tests.ts
 */

import { describe, it, expect } from 'vitest'

console.log('🧪 Running Prediction Market Tests...\n')

// Import and run tests
import('./market.test')
  .then(() => {
    console.log('\n✅ All prediction market tests completed!')
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  })
