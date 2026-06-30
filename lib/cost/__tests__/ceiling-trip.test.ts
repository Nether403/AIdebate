// Feature: cost-governor, Property 2: Ceiling trips iff configured and strictly exceeded
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { evaluateCeiling, type CeilingType } from '../ceiling'

const ceilingType = (): fc.Arbitrary<CeilingType> =>
  fc.constantFrom<CeilingType>('per_debate', 'per_run')

// Finite cost-like doubles, including 0 and large values, no NaN/Infinity.
const finiteCost = (): fc.Arbitrary<number> =>
  fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true })

describe('evaluateCeiling - Property 2: trips iff configured and strictly exceeded', () => {
  it('trips iff ceiling is non-null AND accumulated > ceiling (strict)', () => {
    fc.assert(
      fc.property(
        ceilingType(),
        finiteCost(),
        // ceiling is either null (unconfigured) or a finite number
        fc.option(finiteCost(), { nil: null }),
        (type, accumulated, ceiling) => {
          const decision = evaluateCeiling(type, accumulated, ceiling)

          const expected = ceiling !== null && accumulated > ceiling
          assert.equal(decision.tripped, expected)

          // Decision echoes its inputs faithfully.
          assert.equal(decision.ceilingType, type)
          assert.equal(decision.ceiling, ceiling)
          assert.equal(decision.accumulated, accumulated)

          // An unconfigured (null) ceiling never trips and never restricts.
          if (ceiling === null) {
            assert.equal(decision.tripped, false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('does NOT trip at exact boundary equality (accumulated === ceiling)', () => {
    fc.assert(
      fc.property(ceilingType(), finiteCost(), (type, value) => {
        const decision = evaluateCeiling(type, value, value)
        // Strict comparison: equality must not trip.
        assert.equal(decision.tripped, false)
      }),
      { numRuns: 100 }
    )
  })

  it('trips just above the boundary and not just at/below it', () => {
    fc.assert(
      fc.property(
        ceilingType(),
        fc.double({ min: 0, max: 999_999, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: Number.MIN_VALUE, max: 1, noNaN: true, noDefaultInfinity: true }),
        (type, ceiling, delta) => {
          const above = ceiling + delta
          // Discard cases where float rounding collapses `above` back to `ceiling`
          // (e.g. a subnormal delta added to a tiny ceiling); they are not "above".
          fc.pre(above > ceiling)
          // Strictly above -> trips.
          assert.equal(evaluateCeiling(type, above, ceiling).tripped, true)
          // At the ceiling -> does not trip.
          assert.equal(evaluateCeiling(type, ceiling, ceiling).tripped, false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
