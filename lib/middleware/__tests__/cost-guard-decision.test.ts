// Feature: cost-governor, Property 9: Daily cap decision boundary and denial payload
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { decideCostGuard } from '../cost-guard'

// Finite, cost-like doubles (no NaN/Infinity). Includes 0 and large values, and
// a small negative range so the decision logic is exercised across the boundary
// regardless of sign. Real spend/estimate are >= 0, but the decision rule is a
// pure comparison and must hold for any finite triple.
const finiteVal = (): fc.Arbitrary<number> =>
  fc.double({ min: -1_000, max: 1_000_000, noNaN: true, noDefaultInfinity: true })

describe('decideCostGuard - Property 9: daily cap boundary and denial payload', () => {
  it('allows iff currentSpend + estimatedCost <= cap (denies strictly above)', () => {
    fc.assert(
      fc.property(finiteVal(), finiteVal(), finiteVal(), (spend, estimate, cap) => {
        const decision = decideCostGuard(spend, estimate, cap)

        const expectedAllowed = spend + estimate <= cap
        assert.equal(decision.allowed, expectedAllowed)

        // The trio is always echoed faithfully (Req 6.3).
        assert.equal(decision.currentSpend, spend)
        assert.equal(decision.cap, cap)
        assert.equal(decision.estimatedCost, estimate)

        // Every denied request reports the trio and is itself the gate: a denial
        // decision is `allowed: false`, which is what prevents the provider call
        // (Req 6.4). The helper performs no IO, so it initiates nothing.
        if (!decision.allowed) {
          assert.equal(decision.allowed, false)
          assert.ok(decision.reason && decision.reason.length > 0)
          assert.equal(typeof decision.currentSpend, 'number')
          assert.equal(typeof decision.cap, 'number')
          assert.equal(typeof decision.estimatedCost, 'number')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('ALLOWS at exact boundary equality (currentSpend + estimatedCost === cap)', () => {
    fc.assert(
      fc.property(finiteVal(), finiteVal(), (spend, estimate) => {
        // Construct a cap exactly equal to the sum; equality must be allowed.
        const cap = spend + estimate
        const decision = decideCostGuard(spend, estimate, cap)
        assert.equal(decision.allowed, true)
        assert.equal(decision.reason, undefined)
      }),
      { numRuns: 100 }
    )
  })

  it('DENIES just above the boundary', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 500_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: Number.MIN_VALUE, max: 1, noNaN: true, noDefaultInfinity: true }),
        (spend, estimate, delta) => {
          const sum = spend + estimate
          const cap = sum - delta
          // Discard cases where float rounding collapses cap back to the sum
          // (a subnormal delta against a large sum); they are not "above".
          fc.pre(sum > cap)
          const decision = decideCostGuard(spend, estimate, cap)
          assert.equal(decision.allowed, false)
          assert.ok(decision.reason && decision.reason.length > 0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
