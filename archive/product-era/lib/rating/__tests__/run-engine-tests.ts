/**
 * Test runner for rating engine tests (without database)
 * Run with: npx tsx lib/rating/__tests__/run-engine-tests.ts
 */

// Mock global test functions
type TestFn = () => void | Promise<void>
type TestSuite = { name: string; fn: TestFn }
type TestCase = { suite: string; name: string; fn: TestFn }

const suites: TestSuite[] = []
const tests: TestCase[] = []
let currentSuite = ''

global.describe = (name: string, fn: TestFn) => {
  suites.push({ name, fn })
}

global.it = (name: string, fn: TestFn) => {
  tests.push({ suite: currentSuite, name, fn })
}

let beforeEachFn: TestFn | null = null

global.beforeEach = (fn: TestFn) => {
  beforeEachFn = fn
}

global.expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to be ${expected}`)
    }
  },
  toBeCloseTo: (expected: number, precision: number = 2) => {
    const factor = Math.pow(10, precision)
    const actualRounded = Math.round(actual * factor) / factor
    const expectedRounded = Math.round(expected * factor) / factor
    if (actualRounded !== expectedRounded) {
      throw new Error(`Expected ${actual} to be close to ${expected} (precision: ${precision})`)
    }
  },
  toBeGreaterThan: (expected: any) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`)
    }
  },
  toBeLessThan: (expected: any) => {
    if (actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`)
    }
  },
  toBeGreaterThanOrEqual: (expected: any) => {
    if (actual < expected) {
      throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`)
    }
  },
  toBeLessThanOrEqual: (expected: any) => {
    if (actual > expected) {
      throw new Error(`Expected ${actual} to be less than or equal to ${expected}`)
    }
  },
  not: {
    toBe: (expected: any) => {
      if (actual === expected) {
        throw new Error(`Expected ${actual} not to be ${expected}`)
      }
    },
  },
  toHaveLength: (expected: number) => {
    if (actual.length !== expected) {
      throw new Error(`Expected array to have length ${expected}, got ${actual.length}`)
    }
  },
})

async function runTests() {
  console.log('🧪 Running Rating Engine Tests (Unit Tests Only)\n')

  // Import test file
  await import('./engine.test')

  let passed = 0
  let failed = 0
  const failures: Array<{ suite: string; test: string; error: Error }> = []

  // Run each suite
  for (const suite of suites) {
    currentSuite = suite.name
    console.log(`\n📦 ${suite.name}`)
    
    // Execute suite to register tests
    await suite.fn()
    
    // Run tests in this suite
    const suiteTests = tests.filter(t => t.suite === suite.name)
    
    for (const test of suiteTests) {
      try {
        // Run beforeEach if defined
        if (beforeEachFn) {
          await beforeEachFn()
        }
        
        await test.fn()
        console.log(`  ✅ ${test.name}`)
        passed++
      } catch (error) {
        console.log(`  ❌ ${test.name}`)
        failed++
        failures.push({
          suite: suite.name,
          test: test.name,
          error: error as Error,
        })
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Test Summary:`)
  console.log(`   Passed: ${passed}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total:  ${passed + failed}`)

  if (failures.length > 0) {
    console.log('\n❌ Failures:\n')
    for (const failure of failures) {
      console.log(`   ${failure.suite} > ${failure.test}`)
      console.log(`   ${failure.error.message}\n`)
    }
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})
