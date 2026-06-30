// Feature: cost-governor, Property 8: Current-day spend sums only in-window costs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { sumSpendInDayWindow, type ProviderCallCostRow } from '../cost-guard'

/**
 * Property 8: Current-day spend sums only in-window costs.
 *
 * For any set of provider-call records with arbitrary createdAt timestamps and
 * reported costs, the current-day spend equals the normalized sum (0/null -> 0)
 * of cost_estimate of EXACTLY those records whose createdAt falls within
 * [00:00:00.000, 23:59:59.999] UTC of the current calendar date.
 *
 * Validates: Requirements 6.1, 6.5
 */

const DAY_MS = 86_400_000

// Offsets in milliseconds relative to the current UTC day's 00:00:00.000.
// Clustered around the two day boundaries (start and next-day rollover) so the
// inclusive window edges are exercised, plus broad random offsets spanning the
// previous, current, and next day.
const offsetArb: fc.Arbitrary<number> = fc.oneof(
  fc.constant(0),               // exact start boundary (in window)
  fc.constant(DAY_MS - 1),      // 23:59:59.999 (in window)
  fc.constant(DAY_MS),          // next day 00:00:00.000 (out of window)
  fc.constant(-1),              // prev day 23:59:59.999 (out of window)
  fc.integer({ min: -3, max: 3 }),                 // straddle start boundary
  fc.integer({ min: DAY_MS - 3, max: DAY_MS + 3 }), // straddle end/rollover boundary
  fc.integer({ min: -DAY_MS, max: 2 * DAY_MS })     // broad spread across 3 days
)

// Reported costs mixing positive doubles, exact 0, null, and negatives — the
// normalization rule (0/null/negative -> 0 contribution) must apply only after
// window selection.
const costArb: fc.Arbitrary<number | null> = fc.oneof(
  fc.double({ min: 0, max: 1_000, noNaN: true }),
  fc.constant(0),
  fc.constant(null),
  fc.double({ min: -1_000, max: -Number.MIN_VALUE, noNaN: true })
)

const nowArb: fc.Arbitrary<Date> = fc.date({
  min: new Date('2020-01-01T00:00:00.000Z'),
  max: new Date('2030-12-31T23:59:59.999Z'),
})

test('Property 8: current-day spend sums only in-window costs', () => {
  fc.assert(
    fc.property(
      nowArb,
      fc.array(fc.record({ offset: offsetArb, cost: costArb })),
      (now, specs) => {
        const dayStart = Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0, 0, 0, 0
        )
        const dayEnd = dayStart + DAY_MS - 1 // 23:59:59.999 inclusive

        const rows: ProviderCallCostRow[] = specs.map((s) => ({
          createdAt: new Date(dayStart + s.offset),
          costEstimate: s.cost,
        }))

        // Independent re-derivation: normalized sum over EXACTLY the in-window
        // records. Normalization is inlined (finite & >= 0 keeps value, else 0)
        // so the oracle shares no code with the implementation.
        let expected = 0
        for (const r of rows) {
          const t = r.createdAt.getTime()
          if (t >= dayStart && t <= dayEnd) {
            const c = r.costEstimate
            if (typeof c === 'number' && Number.isFinite(c) && c >= 0) {
              expected += c
            }
          }
        }

        assert.equal(sumSpendInDayWindow(rows, now), expected)
      }
    ),
    { numRuns: 100 }
  )
})
