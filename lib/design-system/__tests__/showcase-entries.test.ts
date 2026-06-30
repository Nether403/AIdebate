// Feature: showcase-redesign, Property 3: Showcase hub entries are well-formed and navigable
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  SHOWCASE_ENTRIES,
  EXISTING_ROUTES,
  isValidShowcaseEntry,
  isRealRoute,
  SHOWCASE_TITLE_MIN,
  SHOWCASE_TITLE_MAX,
  SHOWCASE_DESCRIPTION_MIN,
  SHOWCASE_DESCRIPTION_MAX,
  type ShowcaseEntry,
} from '../manifest'

/**
 * Property 3: Showcase hub entries are well-formed and navigable.
 *
 * For all entries in the showcase registry, the title length is between 1 and
 * 80 characters inclusive, the description length is between 1 and 200
 * characters inclusive, and the `href` resolves to a route in the set of
 * existing application routes.
 *
 * Two complementary parts:
 *   1. Real-data invariant — every shipped SHOWCASE_ENTRIES entry satisfies
 *      the bounds and links to a real route. This is what the renderer maps.
 *   2. Generator-based — across valid AND invalid generated entries,
 *      `isValidShowcaseEntry` returns true exactly when all three conditions
 *      hold (oracle re-derives bounds + route membership independently). This
 *      proves the validator the renderer relies on is correct.
 *
 * Validates: Requirements 4.1
 */

// Independent oracle: recompute the contract from the spec, not from the SUT.
function expectedValid(entry: ShowcaseEntry): boolean {
  const titleOk =
    entry.title.length >= SHOWCASE_TITLE_MIN && entry.title.length <= SHOWCASE_TITLE_MAX
  const descOk =
    entry.description.length >= SHOWCASE_DESCRIPTION_MIN &&
    entry.description.length <= SHOWCASE_DESCRIPTION_MAX
  const hrefOk = EXISTING_ROUTES.has(entry.href)
  return titleOk && descOk && hrefOk
}

const realRoutes = [...EXISTING_ROUTES]

// A title generator that straddles the bounds: empty (len 0), in-range, and
// over-long (>80). minLength 0 lets fast-check explore the lower boundary.
const titleArb = fc.string({ minLength: 0, maxLength: 120 })
// A description generator straddling 0 and >200.
const descriptionArb = fc.string({ minLength: 0, maxLength: 260 })
// Hrefs: a real route, or an arbitrary string that is usually NOT a real route.
const hrefArb = fc.oneof(
  fc.constantFrom(...realRoutes),
  fc.string({ minLength: 0, maxLength: 40 }),
  fc.webPath()
)

const entryArb: fc.Arbitrary<ShowcaseEntry> = fc.record({
  href: hrefArb,
  title: titleArb,
  description: descriptionArb,
})

test('Property 3: showcase hub entries are well-formed and navigable', () => {
  // Part 1: real-data invariant — the shipped registry the renderer consumes.
  for (const entry of SHOWCASE_ENTRIES) {
    assert.ok(
      entry.title.length >= SHOWCASE_TITLE_MIN && entry.title.length <= SHOWCASE_TITLE_MAX,
      `title out of bounds for ${entry.href}: ${entry.title.length}`
    )
    assert.ok(
      entry.description.length >= SHOWCASE_DESCRIPTION_MIN &&
        entry.description.length <= SHOWCASE_DESCRIPTION_MAX,
      `description out of bounds for ${entry.href}: ${entry.description.length}`
    )
    assert.ok(isRealRoute(entry.href), `href not a real route: ${entry.href}`)
    assert.ok(isValidShowcaseEntry(entry), `entry rejected by validator: ${entry.href}`)
  }

  // Part 2: generator-based — validator agrees with the independent oracle on
  // both valid and invalid entries.
  fc.assert(
    fc.property(entryArb, (entry) => {
      assert.equal(isValidShowcaseEntry(entry), expectedValid(entry))
    }),
    { numRuns: 200 }
  )
})
