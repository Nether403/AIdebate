// Feature: cost-governor, Property 10: Ceiling validation accepts exactly the in-range values
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  validateCostCeilings,
  CEILING_MIN,
  CEILING_MAX,
  type CeilingValidationError,
} from '../ceiling'

/**
 * Property 10: Ceiling validation accepts exactly the in-range values.
 *
 * For any candidate ceiling value, `validateCostCeilings` accepts a *present*
 * ceiling iff it is a finite number in [0, 1_000_000]; an absent ceiling
 * (null/undefined) is valid/unconfigured. Rejected values produce a validation
 * error naming the offending field.
 *
 * Validates: Requirements 3.3
 */

type FieldValue = number | string | boolean | null | undefined

// Reference oracle: the exact acceptance condition the implementation must match.
function isAccepted(value: FieldValue): boolean {
  // Absent ceilings are unconfigured and therefore valid.
  if (value === undefined || value === null) return true
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= CEILING_MIN &&
    value <= CEILING_MAX
  )
}

// A candidate generator that straddles the [0, 1_000_000] boundaries and also
// covers non-finite (NaN/±Infinity) and non-numeric (string/boolean) values,
// plus the absent cases (null/undefined).
const candidate: fc.Arbitrary<FieldValue> = fc.oneof(
  // Unconstrained doubles: includes NaN, ±Infinity, negatives, and out-of-range.
  fc.double(),
  // In-range bias so the "accept" branch is well exercised.
  fc.double({ min: CEILING_MIN, max: CEILING_MAX, noNaN: true, noDefaultInfinity: true }),
  // Explicit boundary and just-outside-boundary values.
  fc.constantFrom<FieldValue>(
    CEILING_MIN,
    CEILING_MAX,
    -0.0001,
    CEILING_MAX + 0.0001,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    null,
    undefined
  ),
  // Non-numeric values must be rejected when present.
  fc.string(),
  fc.boolean()
)

describe('cost-governor Property 10: ceiling validation range', () => {
  test('accepts a present ceiling iff finite and in [0, 1_000_000]; names invalid fields', () => {
    fc.assert(
      fc.property(candidate, candidate, (perDebate, perRun) => {
        const result = validateCostCeilings({
          perDebateCostCeilingUsd: perDebate,
          perRunCostCeilingUsd: perRun,
        })

        const debateOk = isAccepted(perDebate)
        const runOk = isAccepted(perRun)

        // Overall validity matches the oracle for both fields.
        assert.equal(result.valid, debateOk && runOk)

        const fieldsWithErrors = new Set(
          result.errors.map((e: CeilingValidationError) => e.field)
        )

        // An invalid present value produces an error naming exactly its field.
        assert.equal(fieldsWithErrors.has('perDebateCostCeilingUsd'), !debateOk)
        assert.equal(fieldsWithErrors.has('perRunCostCeilingUsd'), !runOk)

        // No spurious errors, no duplicates: one error per offending field.
        const expectedErrorCount = (debateOk ? 0 : 1) + (runOk ? 0 : 1)
        assert.equal(result.errors.length, expectedErrorCount)

        // Every error names a real field and carries a reason.
        for (const err of result.errors) {
          assert.ok(
            err.field === 'perDebateCostCeilingUsd' ||
              err.field === 'perRunCostCeilingUsd'
          )
          assert.equal(typeof err.reason, 'string')
          assert.ok(err.reason.length > 0)
        }
      }),
      { numRuns: 100 }
    )
  })
})
