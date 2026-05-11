/**
 * Topic Generator Agent smoke tests.
 *
 * These are live-provider tests and should run through `npm run test:live`, not
 * the default unit-test command.
 */

import { TopicGeneratorAgent } from '../topic-generator'

async function runTests() {
  console.log('Running live Topic Generator Agent tests')

  const agent = new TopicGeneratorAgent()
  let passed = 0
  let failed = 0

  async function run(name: string, test: () => Promise<void>) {
    try {
      console.log(`Test: ${name}`)
      await test()
      passed++
      console.log('  PASSED')
    } catch (error) {
      failed++
      console.error(`  FAILED: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  await run('validate balanced topic shape', async () => {
    const validation = await agent.validateTopicBalance(
      'This house believes that remote work is better than office work'
    )

    if (typeof validation.isBalanced !== 'boolean') throw new Error('isBalanced should be boolean')
    if (validation.proAdvantage < -1 || validation.proAdvantage > 1) {
      throw new Error('proAdvantage should be between -1 and 1')
    }
    if (validation.confidence < 0 || validation.confidence > 1) {
      throw new Error('confidence should be between 0 and 1')
    }
    if (!validation.reasoning || validation.reasoning.length < 10) {
      throw new Error('reasoning should be provided')
    }
  })

  await run('check pool status shape', async () => {
    const status = await agent.checkPoolStatus()

    if (typeof status.needsReplenishment !== 'boolean') {
      throw new Error('needsReplenishment should be boolean')
    }
    if (typeof status.activeCount !== 'number' || status.activeCount < 0) {
      throw new Error('activeCount should be non-negative number')
    }
    if (typeof status.targetCount !== 'number' || status.targetCount <= 0) {
      throw new Error('targetCount should be a positive number')
    }
  })

  console.log(`Topic generator live tests: ${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

runTests().catch((error) => {
  console.error('Fatal topic generator test error:', error)
  process.exit(1)
})
