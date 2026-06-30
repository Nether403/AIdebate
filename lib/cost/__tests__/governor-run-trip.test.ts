// Feature: cost-governor, Property 5: A run trip transitions only running or pending debates
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { selectRunTripDebateIds, isCostTrippable } from '../governor'

// The two statuses the per-run trip is allowed to transition (Req 2.2).
const TRIPPABLE = ['running', 'pending'] as const
// Representative non-trippable lifecycle statuses that must be left unchanged.
const NON_TRIPPABLE = ['completed', 'failed', 'evaluation_failed', 'cancelled'] as const

// A status is a known lifecycle value or an arbitrary string (defends against the
// rule accidentally matching anything beyond the exact running/pending set).
const statusArb = (): fc.Arbitrary<string> =>
  fc.oneof(fc.constantFrom<string>(...TRIPPABLE, ...NON_TRIPPABLE), fc.string())

// A set of debates with unique ids (index-based) and random statuses.
const debateSetArb = () =>
  fc
    .array(statusArb(), { maxLength: 40 })
    .map((statuses) => statuses.map((status, i) => ({ id: `debate-${i}`, status })))

describe('selectRunTripDebateIds - Property 5: a run trip transitions only running or pending debates', () => {
  it('selects exactly the running|pending debates and leaves every other debate untouched', () => {
    fc.assert(
      fc.property(debateSetArb(), (debateSet) => {
        const tripped = selectRunTripDebateIds(debateSet)
        const trippedSet = new Set(tripped)

        // Exactly the running|pending debates are selected, in input order.
        const expected = debateSet
          .filter((d) => d.status === 'running' || d.status === 'pending')
          .map((d) => d.id)
        assert.deepEqual(tripped, expected)

        // Every debate's membership matches the rule: running|pending => tripped,
        // anything else => left unchanged (not in the transition set).
        for (const d of debateSet) {
          const shouldTrip = d.status === 'running' || d.status === 'pending'
          assert.equal(trippedSet.has(d.id), shouldTrip)
        }

        // No id is invented or duplicated by the selection.
        const inputIds = new Set(debateSet.map((d) => d.id))
        assert.equal(trippedSet.size, tripped.length)
        for (const id of tripped) assert.ok(inputIds.has(id))
      }),
      { numRuns: 100 }
    )
  })

  it('isCostTrippable is true iff the status is exactly running or pending', () => {
    fc.assert(
      fc.property(statusArb(), (status) => {
        assert.equal(isCostTrippable(status), status === 'running' || status === 'pending')
      }),
      { numRuns: 100 }
    )
  })
})
