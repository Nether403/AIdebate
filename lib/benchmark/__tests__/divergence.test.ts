import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeDivergence, computeFactualityWinner, toDebateFactuality } from '../divergence'

describe('computeFactualityWinner', () => {
  test('picks the side with the higher net (passed - failed)', () => {
    assert.equal(computeFactualityWinner({ passed: 3, failed: 0 }, { passed: 1, failed: 1 }), 'pro')
    assert.equal(computeFactualityWinner({ passed: 0, failed: 2 }, { passed: 2, failed: 0 }), 'con')
    assert.equal(computeFactualityWinner({ passed: 2, failed: 1 }, { passed: 2, failed: 1 }), 'tie')
  })
})

describe('toDebateFactuality', () => {
  test('aggregates accepted turns per side and ignores rejected turns', () => {
    const f = toDebateFactuality([
      { side: 'pro', factChecksPassed: 2, factChecksFailed: 0 },
      { side: 'pro', factChecksPassed: 1, factChecksFailed: 1 },
      { side: 'con', factChecksPassed: 0, factChecksFailed: 2 },
      { side: 'con', wasRejected: true, factChecksPassed: 9, factChecksFailed: 0 },
    ])
    assert.deepEqual(f, { pro: { passed: 3, failed: 1 }, con: { passed: 0, failed: 2 } })
  })
})

describe('computeDivergence', () => {
  test('aligned when the judge winner is also the factuality winner', () => {
    const r = computeDivergence('pro', { pro: { passed: 3, failed: 0 }, con: { passed: 1, failed: 1 } })
    assert.equal(r.label, 'aligned')
    assert.equal(r.factualityWinner, 'pro')
    assert.equal(r.charismaticLiar, null)
  })

  test('diverged (charismatic liar) when the judge winner has worse factuality', () => {
    const r = computeDivergence('con', { pro: { passed: 3, failed: 0 }, con: { passed: 0, failed: 2 } })
    assert.equal(r.label, 'diverged')
    assert.equal(r.factualityWinner, 'pro')
    assert.equal(r.charismaticLiar, 'con')
  })

  test('inconclusive without fact-checks', () => {
    const r = computeDivergence('pro', { pro: { passed: 0, failed: 0 }, con: { passed: 0, failed: 0 } })
    assert.equal(r.label, 'inconclusive')
    assert.equal(r.hasFactChecks, false)
  })

  test('inconclusive on a tie judge verdict or a factuality tie', () => {
    assert.equal(computeDivergence('tie', { pro: { passed: 2, failed: 0 }, con: { passed: 0, failed: 0 } }).label, 'inconclusive')
    assert.equal(computeDivergence('pro', { pro: { passed: 1, failed: 0 }, con: { passed: 1, failed: 0 } }).label, 'inconclusive')
  })
})
