// Feature: cost-governor, Property 3: A cost trip records complete diagnostics
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { buildCostErrorState } from '../error-state'
import type { CeilingDecision, CeilingType } from '../ceiling'

const ceilingType = (): fc.Arbitrary<CeilingType> =>
  fc.constantFrom<CeilingType>('per_debate', 'per_run')

// Finite cost-like doubles, no NaN/Infinity.
const finiteCost = (): fc.Arbitrary<number> =>
  fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true })

// A tripped ceiling decision always carries a configured (non-null) ceiling.
const trippedDecision = (): fc.Arbitrary<CeilingDecision> =>
  fc.record({
    tripped: fc.constant(true),
    ceilingType: ceilingType(),
    ceiling: finiteCost(),
    accumulated: finiteCost(),
  })

describe('buildCostErrorState - Property 3: a cost trip records complete diagnostics', () => {
  it('captures stage, ceiling type, configured ceiling, accumulated cost, and an ISO timestamp', () => {
    fc.assert(
      fc.property(trippedDecision(), (decision) => {
        const before = Date.now()
        const errorState = buildCostErrorState(decision)
        const after = Date.now()

        // Stage discriminator.
        assert.equal(errorState.stage, 'cost-governor')

        // Triggering ceiling type is preserved.
        assert.equal(errorState.ceilingType, decision.ceilingType)

        // Configured ceiling value is preserved.
        assert.equal(errorState.ceiling, decision.ceiling)

        // Measured accumulated cost is preserved.
        assert.equal(errorState.accumulated, decision.accumulated)

        // Measurement timestamp is a valid ISO 8601 string within the call window.
        assert.equal(typeof errorState.measuredAt, 'string')
        assert.equal(errorState.measuredAt, new Date(errorState.measuredAt).toISOString())
        const measured = Date.parse(errorState.measuredAt)
        assert.ok(Number.isFinite(measured))
        assert.ok(measured >= before && measured <= after)
      }),
      { numRuns: 100 }
    )
  })

  it('preserves a configured ceiling of exactly 0 (not coerced away)', () => {
    fc.assert(
      fc.property(ceilingType(), finiteCost(), (type, accumulated) => {
        // A configured 0 ceiling: any positive accumulated trips it.
        const decision: CeilingDecision = {
          tripped: true,
          ceilingType: type,
          ceiling: 0,
          accumulated,
        }
        const errorState = buildCostErrorState(decision)
        assert.equal(errorState.ceiling, 0)
        assert.equal(errorState.accumulated, accumulated)
        assert.equal(errorState.ceilingType, type)
      }),
      { numRuns: 100 }
    )
  })
})
