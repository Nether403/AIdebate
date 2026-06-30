// Feature: showcase-redesign, Property 5: Navigation integrity — allow-list and non-goal exclusion
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  NAV_ITEMS,
  CTA_TARGETS,
  ALLOWED_NAV_DESTINATIONS,
  matchesExcludedPattern,
} from '../manifest'

/**
 * Property 5: Navigation integrity — allow-list and non-goal exclusion.
 *
 * For all destinations exposed by the Navigation_Shell, the destination
 * identifier is a member of the six approved research destinations; and for all
 * navigation items and CTA targets exposed anywhere in the Showcase_Experience,
 * the destination matches none of the excluded patterns (prediction-market,
 * betting, points/DebatePoints, badge/superforecaster, wagering, social-share,
 * follow, virality).
 *
 * Two parts:
 *   1. Real-data invariant: every NAV_ITEMS id is one of the six approved
 *      destinations, NAV_ITEMS covers exactly those six (no extras, no dupes),
 *      and no href/label/id across NAV_ITEMS + CTA_TARGETS hits an excluded
 *      pattern.
 *   2. Generator-based oracle for matchesExcludedPattern: strings embedding a
 *      banned term return true; benign approved nav/CTA labels and hrefs return
 *      false. This proves the exclusion gate middleware (task 6.1) relies on
 *      actually fires.
 *
 * Validates: Requirements 6.2, 6.3, 6.4
 */

// Banned terms, one drawn from each EXCLUDED_PATTERNS alternative. Embedding any
// of these (with boundary-safe delimiters below) must trip matchesExcludedPattern.
const EXCLUDED_TERMS = [
  'prediction',
  'betting',
  'wager',
  'points',
  'debatepoints',
  'badge',
  'superforecaster',
  'share',
  'social',
  'follow',
  'leaderboard',
  'viral',
] as const

// Benign, approved surface text — labels and hrefs the manifest actually ships.
// None of these may match an excluded pattern.
const BENIGN_POOL = [
  ...NAV_ITEMS.map((n) => n.label),
  ...NAV_ITEMS.map((n) => n.href),
  ...NAV_ITEMS.map((n) => n.id),
  ...CTA_TARGETS.map((c) => c.label),
  ...CTA_TARGETS.map((c) => c.href),
  ...CTA_TARGETS.map((c) => c.id),
]

// Prefixes/suffixes end/begin with a non-word char (or empty) so the word-boundary
// patterns (\bpoints\b, \bfollow\b) still fire when a term is embedded.
const oracleArb: fc.Arbitrary<{ value: string; expected: boolean }> = fc.oneof(
  fc
    .record({
      term: fc.constantFrom(...EXCLUDED_TERMS),
      pre: fc.constantFrom('', 'model ', 'view-', 'go/', 'nav.'),
      post: fc.constantFrom('', ' page', '-cta', '/x', '.html'),
    })
    .map(({ term, pre, post }) => ({ value: `${pre}${term}${post}`, expected: true })),
  fc.constantFrom(...BENIGN_POOL).map((value) => ({ value, expected: false }))
)

test('Property 5: navigation integrity — allow-list and non-goal exclusion', () => {
  const approved = new Set<string>(ALLOWED_NAV_DESTINATIONS)

  // Part 1a — every nav id is an approved destination, covering exactly the six
  // with no extras and no duplicates.
  const navIds = NAV_ITEMS.map((n) => n.id)
  assert.equal(navIds.length, ALLOWED_NAV_DESTINATIONS.length, 'NAV_ITEMS count != approved count')
  assert.equal(new Set(navIds).size, navIds.length, 'NAV_ITEMS contains duplicate ids')
  for (const id of navIds) {
    assert.ok(approved.has(id), `NAV_ITEMS id not an approved destination: ${id}`)
  }
  for (const dest of ALLOWED_NAV_DESTINATIONS) {
    assert.ok(navIds.includes(dest), `approved destination missing from NAV_ITEMS: ${dest}`)
  }

  // Part 1b — no shipped href/label/id (nav or CTA) hits an excluded pattern.
  for (const item of [...NAV_ITEMS, ...CTA_TARGETS]) {
    for (const field of [item.href, item.label, item.id]) {
      assert.ok(
        !matchesExcludedPattern(field),
        `manifest field hits excluded pattern: ${field}`
      )
    }
  }

  // Part 2 — generator-based oracle: banned terms fire, approved text does not.
  fc.assert(
    fc.property(oracleArb, ({ value, expected }) => {
      assert.equal(
        matchesExcludedPattern(value),
        expected,
        `matchesExcludedPattern(${JSON.stringify(value)}) expected ${expected}`
      )
    }),
    { numRuns: 200 }
  )
})
