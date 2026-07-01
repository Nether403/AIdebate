// Feature: app-redesign, Task 4.5 — severity mapping + CssBar fill bounds.
//
// Validates: Requirements 13.2, 13.3
//   13.2 "WHERE the Eval_Report_Screen renders a charismatic-liar count, THE
//         Design_System SHALL map a count of 0 to the low severity style
//         (cyan→violet gradient), a count of 1 to 2 to the elevated severity
//         style (amber), and a count of 3 or more to the high severity style
//         (rose)."
//   13.3 "WHERE the Eval_Report_Screen renders a CSS comparison bar, THE
//         Design_System SHALL render its fill width between 0 and 100 percent,
//         proportional to the bar's value relative to the maximum value in its
//         row."
//
// Both helpers under test are pure, so the properties hold over the real
// implementation with no rendering/mocking.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { severity, clampFillPercent, type SeverityStyle } from '../CssBar'

// Expected style per bucket — the single source of truth the property checks
// against, mirroring Req 13.2 (cyan→violet / amber / rose).
const EXPECTED: Record<SeverityStyle['label'], SeverityStyle> = {
  low: { text: 'text-cyan-300', dot: 'bg-cyan-400', bar: 'from-cyan-500 to-violet-500', label: 'low' },
  elevated: { text: 'text-amber-400', dot: 'bg-amber-500', bar: 'from-amber-500 to-amber-400', label: 'elevated' },
  high: { text: 'text-rose-400', dot: 'bg-rose-500', bar: 'from-rose-500 to-rose-400', label: 'high' },
}

function expectedBucket(count: number): SeverityStyle['label'] {
  if (count >= 3) return 'high'
  if (count >= 1) return 'elevated'
  return 'low'
}

// --- Property: severity buckets (Req 13.2) ---------------------------------
test('severity maps count to the correct bucket and full style (Req 13.2)', () => {
  fc.assert(
    fc.property(
      // Include 0, the 1–2 band, the >=3 band, and large counts; negatives too
      // since count==0 is the documented "low" floor and the helper treats any
      // non-positive count as low.
      fc.integer({ min: -50, max: 100_000 }),
      (count) => {
        const style = severity(count)
        const bucket = expectedBucket(count)
        // label is exactly the bucket, and label==='low' iff count<=0 (0 per
        // the spec; the helper extends low to non-positive), 'elevated' iff
        // 1<=count<=2, 'high' iff count>=3.
        assert.equal(style.label, bucket)
        assert.deepEqual(style, EXPECTED[bucket])
      }
    ),
    { numRuns: 500 }
  )

  // Pin the exact thresholds at the boundaries (0/1/2/3) so a drift in the
  // band edges can't hide behind random sampling.
  assert.equal(severity(0).label, 'low')
  assert.equal(severity(1).label, 'elevated')
  assert.equal(severity(2).label, 'elevated')
  assert.equal(severity(3).label, 'high')
})

// --- Property A: fill bound holds for ALL inputs (Req 13.3) ----------------
// The universal invariant — fill width is always a finite percent in [0,100],
// for any double pair including NaN/±Infinity and overflow-inducing denormals.
test('clampFillPercent always returns a finite percent in [0,100] (Req 13.3)', () => {
  fc.assert(
    fc.property(
      fc.double({ noDefaultInfinity: false, noNaN: false }),
      fc.double({ noDefaultInfinity: false, noNaN: false }),
      (value, max) => {
        const pct = clampFillPercent(value, max)
        assert.ok(Number.isFinite(pct), `pct should be finite, got ${pct}`)
        assert.ok(pct >= 0 && pct <= 100, `pct ${pct} out of [0,100] for (${value}, ${max})`)
        // Non-positive / non-finite max collapses to 0 regardless of value.
        if (!(max > 0)) assert.equal(pct, 0)
      }
    ),
    { numRuns: 1000 }
  )
})

// --- Property B: proportionality over the realistic domain (Req 13.3) ------
// Bar values are counts / percentages / scores — non-negative finite numbers of
// sane magnitude — so proportionality and the directional edges are asserted
// over that domain. (Pathological denormals near Number.MIN_VALUE can overflow
// the intermediate product to Infinity; the helper then safely returns 0, which
// Property A already covers as in-bounds. They are not real bar inputs.)
test('clampFillPercent is proportional to value/max over the realistic domain (Req 13.3)', () => {
  const sane = fc.double({ min: 0, max: 1e6, noDefaultInfinity: true, noNaN: true })
  fc.assert(
    fc.property(sane, fc.double({ min: 1e-3, max: 1e6, noDefaultInfinity: true, noNaN: true }), (value, max) => {
      const pct = clampFillPercent(value, max)
      if (value > max) {
        assert.equal(pct, 100) // value > max > 0 → 100
      } else {
        // 0 <= value <= max → exactly proportional.
        const expected = (value / max) * 100
        assert.ok(
          Math.abs(pct - expected) < 1e-9,
          `expected ${expected}, got ${pct} for (${value}, ${max})`
        )
      }
    }),
    { numRuns: 1000 }
  )

  // value < 0 → 0 across the realistic negative domain.
  fc.assert(
    fc.property(
      fc.double({ min: -1e6, max: -1e-3, noDefaultInfinity: true, noNaN: true }),
      fc.double({ min: 1e-3, max: 1e6, noDefaultInfinity: true, noNaN: true }),
      (value, max) => assert.equal(clampFillPercent(value, max), 0)
    ),
    { numRuns: 500 }
  )

  // Explicit edge cases from Req 13.3 / the helper contract.
  assert.equal(clampFillPercent(5, 0), 0) // max <= 0 → 0
  assert.equal(clampFillPercent(5, -1), 0) // max < 0 → 0
  assert.equal(clampFillPercent(-3, 10), 0) // value < 0 → 0
  assert.equal(clampFillPercent(20, 10), 100) // value > max → 100
  assert.equal(clampFillPercent(0, 10), 0) // floor
  assert.equal(clampFillPercent(10, 10), 100) // ceiling
  assert.equal(clampFillPercent(5, 10), 50) // proportional midpoint
  assert.equal(clampFillPercent(5, Number.NaN), 0) // non-finite max → 0
})
