#!/usr/bin/env tsx
/**
 * Test Runner for LangGraph Agents
 * 
 * Run with: tsx lib/agents/__tests__/run-tests.ts
 */

import { runTests } from './graph.test'

async function main() {
  try {
    await runTests()
    process.exit(0)
  } catch (error) {
    console.error('Test execution failed:', error)
    process.exit(1)
  }
}

main()

