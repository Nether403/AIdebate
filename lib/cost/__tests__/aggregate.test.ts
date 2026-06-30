// Feature: cost-governor, Property 1: Cost aggregation normalizes and sums
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { sumReportedCost, type ReportedCost } from '../aggregate'

/**
 * Property 1: Cost aggregation normalizes and sums.
 *
 * For any list of reported costs whose entries may be finite numbers, 0, null,
 * undefined, negative numbers, or non-numeric values, sumReportedCost returns:
 *   - total === arithmetic sum of only the finite, >= 0 entries (everything else
 *     contributes exactly 0),
 *   - invalidCount === number of negative or non-numeric entries,
 *   - total always finite and >= 0,
 * and aggregation never throws.
 *
 * Validates: Requirements 1.1, 2.1, 4.1, 4.2, 4.3, 4.4, 4.5
 */

// A generator spanning every entry kind the aggregator must tolerate: ordinary
// doubles (which include NaN/±Infinity), explicit special floats, negatives,
// null, undefined, and a non-numeric value (string) to exercise the non-number
// branch. The string is intentionally outside the ReportedCost type to model a
// malformed row reaching the pure core.
const reportedCostArb: fc.Arbitrary<ReportedCost> = fc.oneof(
  fc.double(),
  fc.double({ min: -1e6, max: -Number.MIN_VALUE, noNaN: true }),
  fc.constant(0),
  fc.constant(Number.NaN),
  fc.constant(Number.POSITIVE_INFINITY),
  fc.constant(Number.NEGATIVE_INFINITY),
  fc.constant(null),
  fc.constant(undefined),
  fc.constant('not-a-number' as unknown as ReportedCost)
)

test('Property 1: cost aggregation normalizes and sums', () => {
  fc.assert(
    fc.property(fc.array(reportedCostArb), (costs) => {
      // Independent re-derivation of the expected result from the spec.
      let expectedTotal = 0
      let expectedInvalid = 0
      for (const c of costs) {
        const isNumber = typeof c === 'number'
        if (isNumber && Number.isFinite(c) && (c as number) >= 0) {
          expectedTotal += c as number
        } else if (c !== null && c !== undefined) {
          // present but not a finite, non-negative number -> invalid
          expectedInvalid += 1
        }
      }

      const summary = sumReportedCost(costs)

      assert.equal(summary.total, expectedTotal)
      assert.equal(summary.invalidCount, expectedInvalid)
      assert.ok(Number.isFinite(summary.total), 'total must be finite')
      assert.ok(summary.total >= 0, 'total must be >= 0')
    }),
    { numRuns: 100 }
  )
})
