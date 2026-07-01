// Feature: app-redesign, Task 2.6 — Property 1 (Single nav source) + Property 2 (Exactly six destinations).
//
// Validates: Requirements 5.1, 6.1, 6.4
//   5.1 "THE App_Sidebar, App_TopBar, and Landing surfaces SHALL source every
//        navigation and call-to-action link exclusively from the
//        Navigation_Manifest, and each rendered link href SHALL equal a member
//        of EXISTING_ROUTES."
//   6.1 "THE Application SHALL expose zero reachable navigation paths to non-goal
//        features, such that no rendered App_Sidebar entry ... has a target value
//        matching a member of EXCLUDED_PATTERNS."
//   6.4 "THE App_Sidebar SHALL render exactly one entry per approved research
//        destination, totaling exactly six entries ... with no duplicate and no
//        additional entries."
//
// Approach: manifest-level fast-check properties over NAV_ITEMS — the single
// source the App_Sidebar renders (`AppSidebar({ items = NAV_ITEMS })`). RTL/jsdom
// is not wired for node:test in this repo, and the sidebar maps NAV_ITEMS 1:1
// with no invented destinations, so the manifest is the robust core of "what the
// sidebar renders". The generators treat the manifest as untrusted input so a
// future bad edit (an excluded href, a 7th entry, a duplicate id) fails CI.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  NAV_ITEMS,
  ALLOWED_NAV_DESTINATIONS,
  EXISTING_ROUTES,
  isRealRoute,
  matchesExcludedPattern,
} from '../manifest'

// --- Property 1: Single nav source -----------------------------------------
// ∀ links rendered in the sidebar (NAV_ITEMS only): href ∈ EXISTING_ROUTES and
// ∉ EXCLUDED_PATTERNS.
test('Property 1: every sidebar nav href is a real route and never an excluded pattern (Req 5.1, 6.1)', () => {
  // Generator-driven: sample arbitrary NAV_ITEMS entries and assert the invariant.
  fc.assert(
    fc.property(fc.constantFrom(...NAV_ITEMS), (item) => {
      assert.ok(
        isRealRoute(item.href),
        `nav href not a member of EXISTING_ROUTES: ${item.href}`
      )
      assert.ok(
        EXISTING_ROUTES.has(item.href),
        `nav href missing from EXISTING_ROUTES set: ${item.href}`
      )
      assert.ok(
        !matchesExcludedPattern(item.href),
        `nav href matches an EXCLUDED_PATTERN: ${item.href}`
      )
      // The id and label are also rendered/derived surface text — they must not
      // smuggle in a non-goal destination either.
      assert.ok(
        !matchesExcludedPattern(item.id),
        `nav id matches an EXCLUDED_PATTERN: ${item.id}`
      )
      assert.ok(
        !matchesExcludedPattern(item.label),
        `nav label matches an EXCLUDED_PATTERN: ${item.label}`
      )
    }),
    { numRuns: 100 }
  )

  // NAV_ITEMS is finite; random sampling could skip an entry, so also assert the
  // invariant exhaustively over every shipped nav item.
  for (const item of NAV_ITEMS) {
    assert.ok(isRealRoute(item.href), `nav href not a real route: ${item.href}`)
    assert.ok(!matchesExcludedPattern(item.href), `nav href excluded: ${item.href}`)
  }
})

// --- Property 2: Exactly six destinations ----------------------------------
// The sidebar renders one entry per ALLOWED_NAV_DESTINATIONS member, no more,
// no fewer — six distinct destinations, no duplicates, no extras.
test('Property 2: sidebar renders exactly one entry per approved destination, totaling six (Req 6.4)', () => {
  // Exactly six entries, exactly six approved destinations.
  assert.equal(ALLOWED_NAV_DESTINATIONS.length, 6, 'expected exactly six approved destinations')
  assert.equal(NAV_ITEMS.length, 6, 'NAV_ITEMS must render exactly six entries')

  const navIds = NAV_ITEMS.map((n) => n.id)
  // No duplicates.
  assert.equal(new Set(navIds).size, navIds.length, 'NAV_ITEMS contains duplicate ids')

  const approved = new Set<string>(ALLOWED_NAV_DESTINATIONS)

  // Each approved destination appears exactly once across NAV_ITEMS.
  fc.assert(
    fc.property(fc.constantFrom(...ALLOWED_NAV_DESTINATIONS), (dest) => {
      const matches = navIds.filter((id) => id === dest).length
      assert.equal(matches, 1, `approved destination "${dest}" must appear exactly once (found ${matches})`)
    }),
    { numRuns: 50 }
  )

  // Each rendered entry is a member of the approved set — no additional entries.
  fc.assert(
    fc.property(fc.constantFrom(...NAV_ITEMS), (item) => {
      assert.ok(approved.has(item.id), `nav entry is not an approved destination: ${item.id}`)
    }),
    { numRuns: 50 }
  )
})
