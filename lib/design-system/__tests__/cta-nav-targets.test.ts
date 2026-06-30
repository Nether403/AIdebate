// Feature: showcase-redesign, Property 4: Every CTA and navigation target is a real, non-placeholder route
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  NAV_ITEMS,
  CTA_TARGETS,
  EXISTING_ROUTES,
  isResolvableHref,
  isRealRoute,
} from '../manifest'

/**
 * Property 4: Every CTA and navigation target is a real, non-placeholder route.
 *
 * For all call-to-action targets and navigation items in the manifest, the
 * `href` is non-empty, is not an anchor-only "#" link, is not a disabled/
 * non-routable placeholder, and is a member of the set of existing application
 * routes.
 *
 * Two parts:
 *   1. Real-data invariant: every href shipped in NAV_ITEMS + CTA_TARGETS is a
 *      resolvable, real route (non-empty, not '#', not a '#'-anchor, real).
 *   2. Generator-based oracle: isResolvableHref(href) is true exactly when
 *      (href !== '' AND href !== '#' AND !href.startsWith('#') AND the href is
 *      a member of EXISTING_ROUTES) — checked across placeholder, fake, and
 *      real-route inputs.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 */

// Pool of real routes lets the generator hit the "valid" branch alongside the
// placeholder ('', '#', '#section') and not-a-route inputs that must be rejected.
const realRoutes = [...EXISTING_ROUTES]

const hrefArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(''),
  fc.constant('#'),
  fc.string().map((s) => `#${s}`),
  fc.string(),
  fc.constantFrom(...realRoutes)
)

test('Property 4: every CTA and navigation target is a real, non-placeholder route', () => {
  // Part 1 — real-data invariant over what the manifest actually ships.
  for (const item of [...NAV_ITEMS, ...CTA_TARGETS]) {
    assert.ok(
      isResolvableHref(item.href),
      `manifest href not resolvable: ${item.href}`
    )
    assert.ok(item.href.length > 0, `manifest href empty: ${item.href}`)
    assert.notEqual(item.href, '#', 'manifest href is anchor-only "#"')
    assert.ok(!item.href.startsWith('#'), `manifest href is a "#" anchor: ${item.href}`)
    assert.ok(isRealRoute(item.href), `manifest href not a real route: ${item.href}`)
  }

  // Part 2 — generator-based oracle: re-derive the contract independently.
  fc.assert(
    fc.property(hrefArb, (href) => {
      const expected =
        href.length > 0 &&
        href !== '#' &&
        !href.startsWith('#') &&
        EXISTING_ROUTES.has(href)

      assert.equal(isResolvableHref(href), expected)
    }),
    { numRuns: 100 }
  )
})
