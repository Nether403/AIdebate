/**
 * Integration Test: LLM Configuration Fixes
 * 
 * This script tests:
 * 1. GPT-5.1-thinking responses are sanitized (no <thought> tags)
 * 2. Judge uses gemini-3-pro-preview by default
 * 3. Database has correct model identifiers
 * 4. Cost calculations are accurate
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST before any other imports
dotenv.config({ path: resolve(process.cwd(), '.env') })

// Now import everything else
import type { LLMConfig, LLMMessage } from '@/types/llm'
import type { CompletedDebate } from '@/lib/agents/judge'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

function logTest(name: string) {
  log(`\n🧪 Test: ${name}`, 'blue')
}

function logPass(message: string) {
  log(`✅ PASS: ${message}`, 'green')
}

function logFail(message: string) {
  log(`❌ FAIL: ${message}`, 'red')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'yellow')
}

/**
 * Test 1: Verify thinking tag sanitization
 */
async function testThinkingTagSanitization(): Promise<boolean> {
  logTest('Thinking tag sanitization (unit test)')
  
  try {
    // Dynamic import to ensure env vars are loaded
    const { stripThinkingTags } = await import('@/lib/llm/utils/sanitize')
    
    // Test with mock content containing thinking tags
    const mockContent = `<thought>Let me think about this... 2+2 is 4 because...</thought>The answer is 4.`
    
    logInfo('Testing sanitization with mock content containing <thought> tags')
    const sanitized = stripThinkingTags(mockContent)
    
    logInfo(`Original length: ${mockContent.length} characters`)
    logInfo(`Sanitized length: ${sanitized.length} characters`)
    
    // Check for thinking tags in the sanitized response
    const hasThinkingTags = sanitized.includes('<thought>') || 
                           sanitized.includes('</thought>')
    
    if (hasThinkingTags) {
      logFail('Sanitized content still contains <thought> tags!')
      logInfo('Sanitized content:')
      console.log(sanitized)
      return false
    }
    
    logPass('Thinking tags successfully removed')
    
    // Verify the actual content remains
    if (!sanitized.includes('The answer is 4.')) {
      logFail('Sanitization removed too much content!')
      logInfo('Sanitized content:')
      console.log(sanitized)
      return false
    }
    
    logPass('Content outside thinking tags preserved')
    logInfo('Sanitized content:')
    console.log(sanitized)
    
    // Test with multiple thinking tags
    const multipleTagsContent = `<thought>First thought</thought>Some text<thought>Second thought</thought>More text`
    const sanitizedMultiple = stripThinkingTags(multipleTagsContent)
    
    if (sanitizedMultiple.includes('<thought>') || sanitizedMultiple.includes('</thought>')) {
      logFail('Failed to remove multiple thinking tags!')
      return false
    }
    
    logPass('Multiple thinking tags successfully removed')
    
    // Test with no thinking tags (should return unchanged)
    const noTagsContent = 'This is regular content without tags.'
    const sanitizedNoTags = stripThinkingTags(noTagsContent)
    
    if (sanitizedNoTags !== noTagsContent) {
      logFail('Sanitization modified content without thinking tags!')
      return false
    }
    
    logPass('Content without thinking tags remains unchanged')
    
    logInfo('\nNote: GPT-5.1-thinking model not yet available in OpenAI API.')
    logInfo('This test validates the sanitization utility function instead.')
    
    return true
  } catch (error) {
    logFail(`Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

/**
 * Test 2: Verify judge uses gemini-3-pro-preview
 */
async function testJudgeModelConfiguration(): Promise<boolean> {
  logTest('Judge Agent model configuration')

  try {
    // Dynamic import to ensure env vars are loaded
    const { createJudgeAgent } = await import('@/lib/agents/judge')
    // Create judge with default config
    const judge = createJudgeAgent()

    // Access the private config through type assertion
    const judgeConfig = (judge as any).config

    logInfo(`Judge model: ${judgeConfig.model}`)
    logInfo(`Judge provider: ${judgeConfig.provider}`)
    logInfo(`Tiebreaker model: ${judgeConfig.tiebreakerModel}`)
    logInfo(`Tiebreaker provider: ${judgeConfig.tiebreakerProvider}`)

    // Verify judge uses gemini-3-pro-preview
    if (judgeConfig.model !== 'gemini-3-pro-preview') {
      logFail(`Judge model is ${judgeConfig.model}, expected gemini-3-pro-preview`)
      return false
    }

    logPass('Judge uses gemini-3-pro-preview')

    // Verify provider is Google
    if (judgeConfig.provider !== 'google') {
      logFail(`Judge provider is ${judgeConfig.provider}, expected google`)
      return false
    }

    logPass('Judge provider is google')

    // Verify tiebreaker uses gpt-5.1
    if (judgeConfig.tiebreakerModel !== 'gpt-5.1') {
      logFail(`Tiebreaker model is ${judgeConfig.tiebreakerModel}, expected gpt-5.1`)
      return false
    }

    logPass('Tiebreaker uses gpt-5.1')

    // Verify tiebreaker provider is OpenAI
    if (judgeConfig.tiebreakerProvider !== 'openai') {
      logFail(`Tiebreaker provider is ${judgeConfig.tiebreakerProvider}, expected openai`)
      return false
    }

    logPass('Tiebreaker provider is openai')

    return true
  } catch (error) {
    logFail(`Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

/**
 * Test 3: Verify database model identifiers
 */
async function testDatabaseModelIdentifiers(): Promise<boolean> {
  logTest('Database model identifiers')

  try {
    // Dynamic import to ensure env vars are loaded
    const { db } = await import('@/lib/db/client')
    const { models } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    
    // Check for gemini-3-pro-preview
    const gemini3Pro = await db.query.models.findFirst({
      where: eq(models.modelId, 'gemini-3-pro-preview'),
    })

    if (!gemini3Pro) {
      logFail('gemini-3-pro-preview not found in database')
      return false
    }

    logPass(`Found gemini-3-pro-preview: ${gemini3Pro.name}`)
    logInfo(`  Active: ${gemini3Pro.isActive}`)
    logInfo(`  Provider: ${gemini3Pro.provider}`)

    if (!gemini3Pro.isActive) {
      logFail('gemini-3-pro-preview is not active')
      return false
    }

    logPass('gemini-3-pro-preview is active')

    // Check for gemini-2.5-pro
    const gemini25Pro = await db.query.models.findFirst({
      where: eq(models.modelId, 'gemini-2.5-pro'),
    })

    if (!gemini25Pro) {
      logFail('gemini-2.5-pro not found in database')
      return false
    }

    logPass(`Found gemini-2.5-pro: ${gemini25Pro.name}`)

    // Check for GPT-5.1 variants
    const gpt51 = await db.query.models.findFirst({
      where: eq(models.modelId, 'gpt-5.1'),
    })

    if (!gpt51) {
      logFail('gpt-5.1 not found in database')
      return false
    }

    logPass(`Found gpt-5.1: ${gpt51.name}`)

    const gpt51Thinking = await db.query.models.findFirst({
      where: eq(models.modelId, 'gpt-5.1-thinking'),
    })

    if (!gpt51Thinking) {
      logFail('gpt-5.1-thinking not found in database')
      return false
    }

    logPass(`Found gpt-5.1-thinking: ${gpt51Thinking.name}`)

    // Check that legacy models are marked inactive
    const gemini15Pro = await db.query.models.findFirst({
      where: eq(models.modelId, 'gemini-1.5-pro'),
    })

    if (gemini15Pro) {
      logInfo(`Found legacy model gemini-1.5-pro: ${gemini15Pro.name}`)
      if (gemini15Pro.isActive) {
        logFail('Legacy model gemini-1.5-pro should be inactive')
        return false
      }
      logPass('Legacy model gemini-1.5-pro is correctly marked inactive')
    } else {
      logInfo('Legacy model gemini-1.5-pro not in database (acceptable)')
    }

    return true
  } catch (error) {
    logFail(`Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

/**
 * Test 4: Verify cost calculations
 */
async function testCostCalculations(): Promise<boolean> {
  logTest('Cost calculations for updated models')

  try {
    // Dynamic import to ensure env vars are loaded
    const { getLLMClient } = await import('@/lib/llm/client')
    const client = getLLMClient()

    // Test Google provider pricing for gemini-3-pro-preview
    if (client.isProviderAvailable('google')) {
      const gemini3Cost = client.calculateCost(1000, 1000, 'gemini-3-pro-preview', 'google')
      logInfo(`Gemini 3 Pro Preview cost (1K in, 1K out): $${gemini3Cost.toFixed(4)}`)
      
      // Expected: (1000/1M * 1.25) + (1000/1M * 5.00) = 0.00125 + 0.005 = 0.00625
      const expectedGemini3Cost = 0.00625
      if (Math.abs(gemini3Cost - expectedGemini3Cost) > 0.0001) {
        logFail(`Gemini 3 Pro Preview cost incorrect. Expected $${expectedGemini3Cost.toFixed(4)}, got $${gemini3Cost.toFixed(4)}`)
        return false
      }
      logPass('Gemini 3 Pro Preview cost calculation correct')

      // Test gemini-2.5-pro pricing
      const gemini25Cost = client.calculateCost(1000, 1000, 'gemini-2.5-pro', 'google')
      logInfo(`Gemini 2.5 Pro cost (1K in, 1K out): $${gemini25Cost.toFixed(4)}`)
      
      const expectedGemini25Cost = 0.00625
      if (Math.abs(gemini25Cost - expectedGemini25Cost) > 0.0001) {
        logFail(`Gemini 2.5 Pro cost incorrect. Expected $${expectedGemini25Cost.toFixed(4)}, got $${gemini25Cost.toFixed(4)}`)
        return false
      }
      logPass('Gemini 2.5 Pro cost calculation correct')
    } else {
      logInfo('Google provider not available. Skipping Google pricing tests.')
    }

    // Test OpenAI provider pricing for GPT-5.1
    if (client.isProviderAvailable('openai')) {
      const gpt51Cost = client.calculateCost(1000, 1000, 'gpt-5.1', 'openai')
      logInfo(`GPT-5.1 cost (1K in, 1K out): $${gpt51Cost.toFixed(4)}`)
      
      // Verify cost is non-zero
      if (gpt51Cost === 0) {
        logFail('GPT-5.1 cost is zero - pricing not configured')
        return false
      }
      logPass('GPT-5.1 cost calculation returns non-zero value')

      const gpt51ThinkingCost = client.calculateCost(1000, 1000, 'gpt-5.1-thinking', 'openai')
      logInfo(`GPT-5.1-thinking cost (1K in, 1K out): $${gpt51ThinkingCost.toFixed(4)}`)
      
      if (gpt51ThinkingCost === 0) {
        logFail('GPT-5.1-thinking cost is zero - pricing not configured')
        return false
      }
      logPass('GPT-5.1-thinking cost calculation returns non-zero value')
    } else {
      logInfo('OpenAI provider not available. Skipping OpenAI pricing tests.')
    }

    return true
  } catch (error) {
    logFail(`Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

/**
 * Test 5: End-to-end judge evaluation (optional, requires API keys)
 */
async function testJudgeEvaluation(): Promise<boolean> {
  logTest('Judge evaluation with gemini-3-pro-preview')

  try {
    // Dynamic import to ensure env vars are loaded
    const { getLLMClient } = await import('@/lib/llm/client')
    const { createJudgeAgent } = await import('@/lib/agents/judge')
    const client = getLLMClient()

    // Check if Google provider is available
    if (!client.isProviderAvailable('google')) {
      logInfo('Google provider not available (missing API key). Skipping test.')
      return true // Skip test, not a failure
    }

    // Create a mock debate for testing
    const mockDebate: CompletedDebate = {
      id: 'test-debate-001',
      topic: 'Artificial intelligence will benefit humanity more than harm it',
      pro_turns: [
        {
          debateId: 'test-debate-001',
          side: 'pro',
          roundNumber: 1,
          speech: 'AI has already revolutionized healthcare, enabling early disease detection and personalized treatment plans. Machine learning algorithms can analyze medical images with accuracy matching or exceeding human experts.',
          reflection: 'The opponent will likely argue about job displacement and safety concerns.',
          critique: 'However, these concerns are manageable with proper regulation.',
          wordCount: 35,
          tokensUsed: 50,
          cost: 0.001,
          latencyMs: 2000,
          createdAt: new Date(),
        },
      ],
      con_turns: [
        {
          debateId: 'test-debate-001',
          side: 'con',
          roundNumber: 1,
          speech: 'While AI has benefits, the risks are substantial. Autonomous weapons, deepfakes, and algorithmic bias threaten democracy and human rights. The concentration of AI power in few corporations creates dangerous monopolies.',
          reflection: 'The pro side focuses on healthcare benefits.',
          critique: 'But they ignore the existential risks and power concentration.',
          wordCount: 38,
          cost: 0.001,
          tokensUsed: 55,
          latencyMs: 2100,
          createdAt: new Date(),
        },
      ],
    }

    logInfo('Creating judge agent...')
    const judge = createJudgeAgent()

    logInfo('Evaluating mock debate...')
    const verdict = await judge.evaluateDebate(mockDebate, 'pro_first')

    logInfo(`Winner: ${verdict.winner}`)
    logInfo(`Logical Coherence: ${verdict.scores.logical_coherence}/10`)
    logInfo(`Rebuttal Strength: ${verdict.scores.rebuttal_strength}/10`)
    logInfo(`Factuality: ${verdict.scores.factuality}/10`)
    logInfo(`Judge Model: ${verdict.metadata.judge_model}`)

    // Verify judge model is gemini-3-pro-preview
    if (verdict.metadata.judge_model !== 'gemini-3-pro-preview') {
      logFail(`Judge used ${verdict.metadata.judge_model}, expected gemini-3-pro-preview`)
      return false
    }

    logPass('Judge evaluation used gemini-3-pro-preview')

    // Verify verdict structure
    if (!['pro', 'con', 'tie'].includes(verdict.winner)) {
      logFail(`Invalid winner value: ${verdict.winner}`)
      return false
    }

    logPass('Verdict has valid winner')

    // Verify scores are in valid range
    const scores = [
      verdict.scores.logical_coherence,
      verdict.scores.rebuttal_strength,
      verdict.scores.factuality,
    ]

    for (const score of scores) {
      if (score < 1 || score > 10) {
        logFail(`Score ${score} is out of range (1-10)`)
        return false
      }
    }

    logPass('All scores are in valid range (1-10)')

    // Verify justification exists and is substantial
    if (verdict.justification.length < 100) {
      logFail(`Justification too short: ${verdict.justification.length} characters`)
      return false
    }

    logPass('Justification meets minimum length requirement')

    logInfo('Justification preview:')
    console.log(verdict.justification.substring(0, 200) + '...')

    return true
  } catch (error) {
    logFail(`Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error(error)
    return false
  }
}

/**
 * Main test runner
 */
async function runTests() {
  logSection('LLM Configuration Fixes - Integration Tests')

  const results: { name: string; passed: boolean }[] = []

  // Test 1: Thinking tag sanitization
  logSection('Test 1: Thinking Tag Sanitization')
  const test1 = await testThinkingTagSanitization()
  results.push({ name: 'Thinking Tag Sanitization', passed: test1 })

  // Test 2: Judge model configuration
  logSection('Test 2: Judge Model Configuration')
  const test2 = await testJudgeModelConfiguration()
  results.push({ name: 'Judge Model Configuration', passed: test2 })

  // Test 3: Database model identifiers
  logSection('Test 3: Database Model Identifiers')
  const test3 = await testDatabaseModelIdentifiers()
  results.push({ name: 'Database Model Identifiers', passed: test3 })

  // Test 4: Cost calculations
  logSection('Test 4: Cost Calculations')
  const test4 = await testCostCalculations()
  results.push({ name: 'Cost Calculations', passed: test4 })

  // Test 5: Judge evaluation (optional)
  logSection('Test 5: Judge Evaluation (End-to-End)')
  const test5 = await testJudgeEvaluation()
  results.push({ name: 'Judge Evaluation', passed: test5 })

  // Summary
  logSection('Test Summary')
  const passed = results.filter((r) => r.passed).length
  const total = results.length

  results.forEach((result) => {
    if (result.passed) {
      logPass(result.name)
    } else {
      logFail(result.name)
    }
  })

  console.log('\n' + '='.repeat(60))
  if (passed === total) {
    log(`\n🎉 All tests passed! (${passed}/${total})`, 'green')
  } else {
    log(`\n⚠️  Some tests failed. (${passed}/${total} passed)`, 'red')
  }
  console.log('='.repeat(60) + '\n')

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1)
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
