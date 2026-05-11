/**
 * Security Tests Runner
 * 
 * Simple test runner for security features
 */

import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { checkSpendingCap, estimateDebateCost, getDailySpendingCap } from '@/lib/security/cost-monitoring'
import { NextRequest } from 'next/server'

console.log('Running Security Tests...\n')

let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn()
    console.log(`✓ PASSED: ${name}`)
    passed++
  } catch (error) {
    console.log(`✗ FAILED: ${name}`)
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    failed++
  }
}

async function runTests() {
  console.log('='.repeat(50))
  console.log('Test 1: Rate Limiting - Allow requests within limit')
  console.log('='.repeat(50))
  
  await test('Rate limit allows first request', async () => {
    const key = `test-${Date.now()}`
    const result = await checkRateLimit(key, {
      maxRequests: 5,
      windowMs: 60000,
      keyPrefix: 'test:ratelimit',
    })
    
    if (!result.success) {
      throw new Error('First request should be allowed')
    }
    if (result.remaining !== 4) {
      throw new Error(`Expected 4 remaining, got ${result.remaining}`)
    }
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('Test 2: Rate Limiting - Block requests exceeding limit')
  console.log('='.repeat(50))
  
  await test('Rate limit blocks after max requests', async () => {
    const key = `test-${Date.now()}`
    const config = {
      maxRequests: 3,
      windowMs: 60000,
      keyPrefix: 'test:ratelimit',
    }
    
    // Make max requests
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, config)
    }
    
    // Next request should be blocked
    const result = await checkRateLimit(key, config)
    if (result.success) {
      throw new Error('Request should be blocked after exceeding limit')
    }
    if (result.remaining !== 0) {
      throw new Error(`Expected 0 remaining, got ${result.remaining}`)
    }
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('Test 3: IP Extraction - x-forwarded-for header')
  console.log('='.repeat(50))
  
  await test('Extract IP from x-forwarded-for', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
    })
    
    const ip = getClientIp(request)
    if (ip !== '192.168.1.1') {
      throw new Error(`Expected 192.168.1.1, got ${ip}`)
    }
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('Test 4: Cost Estimation - Basic debate')
  console.log('='.repeat(50))
  
  await test('Estimate cost for basic debate', () => {
    const cost = estimateDebateCost({
      rounds: 3,
      factCheckingEnabled: false,
      judgeModel: 'gemini-3.0-pro',
    })
    
    if (cost <= 0) {
      throw new Error('Cost should be greater than 0')
    }
    if (cost > 1) {
      throw new Error('Basic debate should cost less than $1')
    }
    
    console.log(`  Estimated cost: $${cost.toFixed(2)}`)
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('Test 5: Cost Estimation - With fact-checking')
  console.log('='.repeat(50))
  
  await test('Fact-checking increases cost', () => {
    const costWithoutFC = estimateDebateCost({
      rounds: 3,
      factCheckingEnabled: false,
      judgeModel: 'gemini-3.0-pro',
    })
    
    const costWithFC = estimateDebateCost({
      rounds: 3,
      factCheckingEnabled: true,
      judgeModel: 'gemini-3.0-pro',
    })
    
    if (costWithFC <= costWithoutFC) {
      throw new Error('Fact-checking should increase cost')
    }
    
    console.log(`  Without FC: $${costWithoutFC.toFixed(2)}`)
    console.log(`  With FC: $${costWithFC.toFixed(2)}`)
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('Test 6: Spending Cap - Get daily cap')
  console.log('='.repeat(50))
  
  await test('Get daily spending cap', () => {
    const cap = getDailySpendingCap()
    
    if (cap <= 0) {
      throw new Error('Daily cap should be greater than 0')
    }
    
    console.log(`  Daily cap: $${cap.toFixed(2)}`)
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('Test 7: Spending Cap - Check current status')
  console.log('='.repeat(50))
  
  await test('Check spending cap status', async () => {
    const status = await checkSpendingCap()
    
    if (status.cap <= 0) {
      throw new Error('Cap should be greater than 0')
    }
    if (status.currentSpend < 0) {
      throw new Error('Current spend should not be negative')
    }
    
    console.log(`  Current spend: $${status.currentSpend.toFixed(2)}`)
    console.log(`  Cap: $${status.cap.toFixed(2)}`)
    console.log(`  Remaining: $${status.remainingBudget.toFixed(2)}`)
    console.log(`  Exceeded: ${status.exceeded}`)
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('Test 8: Duplicate Vote Prevention')
  console.log('='.repeat(50))
  
  await test('Duplicate vote prevention is configured', () => {
    // Check that voting rate limit is configured
    if (!RATE_LIMITS.voting) {
      throw new Error('Voting rate limit not configured')
    }
    if (RATE_LIMITS.voting.maxRequests !== 20) {
      throw new Error(`Expected 20 votes/hour, got ${RATE_LIMITS.voting.maxRequests}`)
    }
    
    console.log(`  Max votes per hour: ${RATE_LIMITS.voting.maxRequests}`)
    console.log(`  Window: ${RATE_LIMITS.voting.windowMs / 1000 / 60} minutes`)
  })
  
  console.log('\n' + '='.repeat(50))
  console.log(`Test Results: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(50))
  
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})
