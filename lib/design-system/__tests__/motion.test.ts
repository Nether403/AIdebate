// Feature: showcase-redesign, Property 7: Motion variants respect motion discipline
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { buildVariant } from '../motion'

/**
 * Property 7: Motion variants respect motion discipline.
 *
 * For all variant kinds and all reduced-motion states, buildVariant(kind, reducedMotion)
 * produces a spec whose entrance duration is at most 600ms; and whenever reducedMotion is
 * true, the spec animates opacity only (no positional `y`, scale, or rotation change) with
 * duration <=200ms.
 *
 * Validates: Requirements 2.7, 9.1, 9.6, 9.7
 */
test('Property 7: motion variants respect motion discipline', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('entrance', 'emphasis', 'hover') as fc.Arbitrary<
        'entrance' | 'emphasis' | 'hover'
      >,
      fc.boolean(),
      (kind, reducedMotion) => {
        const spec = buildVariant(kind, reducedMotion)

        // Always: entrance duration ceiling (Req 9.6).
        assert.ok(spec.durationMs <= 600, `durationMs must be <=600, got ${spec.durationMs}`)

        if (reducedMotion === true) {
          // Opacity-only: no positional/scale/rotation motion (Req 9.7).
          assert.equal(spec.y, undefined, 'reduced motion must not animate y')
          assert.equal(spec.scale, undefined, 'reduced motion must not animate scale')
          assert.notEqual(spec.opacity, undefined, 'reduced motion must animate opacity')
          // Reduced-motion duration ceiling (Req 9.1).
          assert.ok(
            spec.durationMs <= 200,
            `reduced-motion durationMs must be <=200, got ${spec.durationMs}`
          )
        }
      }
    ),
    { numRuns: 100 }
  )
})
