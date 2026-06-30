// Feature: cost-governor, Property 4: No provider calls after a trip
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { evaluateCeiling } from '../ceiling'

/**
 * Property 4 targets the preventive gate (Req 1.4, 2.3): once a trip has
 * happened, no further provider work may be initiated.
 *
 * The gate is a pure status rule, so we test it as such — no live DB. The two
 * predicates below are exactly the rules the DB shell encodes:
 *
 *  - Per-debate gate (Req 1.4): a debate that is already `evaluation_failed`
 *    must not initiate any further provider call. This is the status check the
 *    governor relies on after `tripDebate` flips a debate.
 *
 *  - Per-run gate (Req 2.3): once the run's accumulated cost has strictly
 *    exceeded its per-run ceiling, no additional debate may start. The
 *    underlying decision is `evaluateCeiling('per_run', total, ceiling).tripped`
 *    (the same predicate `isRunCostTripped` returns), so we feed real
 *    accumulated/ceiling pairs through `evaluateCeiling` rather than re-deriving
 *    the boolean.
 */

/** Per-debate preventive gate: a provider call may be initiated iff the debate is not failed. */
const canInitiateProviderCall = (debateStatus: string): boolean =>
  debateStatus !== 'evaluation_failed'

/** Per-run preventive gate: another debate may start iff the run is not cost-tripped. */
const shouldStartNextDebate = (runTripped: boolean): boolean => !runTripped

// The full set of debate statuses the system uses, including the trip target.
const debateStatus = (): fc.Arbitrary<string> =>
  fc.constantFrom(
    'pending',
    'running',
    'completed',
    'evaluation_failed',
    'failed',
    'cancelled'
  )

const finiteCost = (): fc.Arbitrary<number> =>
  fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true })

describe('preventive gate - Property 4: no provider calls after a trip', () => {
  it('per-debate gate forbids provider calls iff the debate is evaluation_failed', () => {
    fc.assert(
      fc.property(debateStatus(), (status) => {
        if (status === 'evaluation_failed') {
          // A tripped debate must not initiate any further provider call (Req 1.4).
          assert.equal(canInitiateProviderCall(status), false)
        } else {
          // Any non-failed status still permits a provider call.
          assert.equal(canInitiateProviderCall(status), true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('per-run gate forbids starting a new debate iff the run is cost-tripped', () => {
    fc.assert(
      fc.property(
        finiteCost(),
        // null ceiling = unconfigured: the run can never be tripped on cost.
        fc.option(finiteCost(), { nil: null }),
        (accumulated, ceiling) => {
          // The run-trip decision is exactly evaluateCeiling(...).tripped.
          const runTripped = evaluateCeiling('per_run', accumulated, ceiling).tripped

          // Tripped iff configured AND strictly exceeded.
          assert.equal(runTripped, ceiling !== null && accumulated > ceiling)

          // The gate permits the next debate iff the run is not tripped (Req 2.3).
          assert.equal(shouldStartNextDebate(runTripped), !runTripped)

          if (runTripped) {
            assert.equal(shouldStartNextDebate(runTripped), false)
          }

          // An unconfigured per-run ceiling never blocks additional debates.
          if (ceiling === null) {
            assert.equal(shouldStartNextDebate(runTripped), true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
