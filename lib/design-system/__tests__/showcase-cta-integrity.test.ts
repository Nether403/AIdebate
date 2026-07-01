// Feature: app-redesign, Task 7.3 — Property 1 (link integrity) applied to
// showcase entry + CTA/nav target validation.
//
// Validates: Requirements 4.1, 4.5, 5.2, 5.4, 6.2
//   4.1 Showcase_Hub renders one card per SHOWCASE_ENTRIES entry, in declared
//       order, each with valid title/description bounds and a real-route href.
//   4.5 IF a showcase entry's link does NOT resolve to a member of
//       EXISTING_ROUTES, THEN the hub omits that entry's card and renders the
//       remaining valid entries (the page filter is `.filter(isRealRoute)`).
//   5.2 IF a nav/CTA href is empty, '#', or an anchor-only placeholder
//       beginning with '#', THEN validation fails for that href, an error
//       identifying the offending href is surfaced, and the link is not rendered.
//   5.4 IF a nav/CTA target does not equal a member of EXISTING_ROUTES, THEN
//       validation fails, an error identifying the offending target is surfaced,
//       and the link is not rendered.
//   6.2 IF a nav/CTA target matches a member of EXCLUDED_PATTERNS, THEN it is
//       rejected (excluded from rendered output) and a validation error
//       identifying the rejected target is surfaced.
//
// Approach: fast-check over the manifest treated as untrusted input. The repo
// has no DOM harness (node:test + fast-check only — see tests/run-unit-tests.ts),
// and the manifest's error-surfacing lives in a module-load self-check
// (`assertManifestInvariants`, not exported), so per the task we drive the
// SHIPPED predicate helpers (isRealRoute / isResolvableHref /
// matchesExcludedPattern / isValidShowcaseEntry) plus the actual page filter,
// and assert the documented "surface an error identifying the offending value"
// behavior via a harness that mirrors the self-check using those same predicates.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  SHOWCASE_ENTRIES,
  CTA_TARGETS,
  EXISTING_ROUTES,
  isRealRoute,
  isResolvableHref,
  isValidShowcaseEntry,
  matchesExcludedPattern,
  type ShowcaseEntry,
} from '../manifest'

// ---------------------------------------------------------------------------
// Error-surfacing harness
// ---------------------------------------------------------------------------
// Mirrors the manifest's documented self-check (assertManifestInvariants) using
// the SHIPPED predicates: a link target is rejected (not rendered) and an error
// string identifying the offending value is surfaced. Order matters — an
// excluded target is named as excluded (Req 6.2) before the generic
// unresolvable reason (Req 5.2 / 5.4). A target renders iff this returns [].
function surfaceLinkErrors(target: string): string[] {
  const errors: string[] = []
  if (matchesExcludedPattern(target)) {
    errors.push(`excluded target rejected from navigation output: ${target}`)
  }
  if (!isResolvableHref(target)) {
    errors.push(`unresolvable link target rejected: ${target}`)
  }
  return errors
}

// ---------------------------------------------------------------------------
// Generators (treat the manifest as untrusted input)
// ---------------------------------------------------------------------------
const realRoutes = [...EXISTING_ROUTES]

// Empty / '#' / anchor-only placeholders (Req 5.2).
const placeholderHrefArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(''),
  fc.constant('#'),
  fc.string().map((s) => `#${s}`)
)

// Route-shaped strings that are NOT members of EXISTING_ROUTES (Req 5.4). The
// leading '/' guarantees non-empty and a non-'#' value; the filter removes the
// rare collision with a real route.
const fakeRouteArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 24 })
  .map((s) => `/${s}`)
  .filter((p) => !EXISTING_ROUTES.has(p))

// Targets matching a member of EXCLUDED_PATTERNS (Req 6.2). Each keyword matches
// its pattern on its own; non-word separators ('/', '-') preserve the word
// boundaries used by the \bbet\b / \bpoints\b / \bfollow\b patterns.
const excludedKeywords = [
  'prediction',
  'betting',
  'bet',
  'wager',
  'points',
  'debatepoints',
  'badge',
  'superforecaster',
  'share',
  'social',
  'follow',
  'leaderboard',
  'virality',
  'viral',
] as const

const excludedTargetArb: fc.Arbitrary<string> = fc
  .tuple(fc.constantFrom(...excludedKeywords), fc.constantFrom('', '/x', '/demo', '/app'))
  .map(([kw, prefix]) => `${prefix}/${kw}`)

// Any "bad" showcase href: placeholder OR fake route. None resolve to a route.
const badHrefArb: fc.Arbitrary<string> = fc.oneof(placeholderHrefArb, fakeRouteArb)

// Title / description generators straddling the declared bounds (Req 4.1).
const titleArb = fc.string({ minLength: 0, maxLength: 120 })
const descriptionArb = fc.string({ minLength: 0, maxLength: 260 })

// ===========================================================================
// Req 4.1 / 4.5 — showcase entries: well-formed, in declared order, bad ones omitted
// ===========================================================================
test('Req 4.1/4.5: showcase entries render in declared order; non-real-route entries are omitted', () => {
  // Req 4.1 — every shipped entry is valid and the page filter keeps them ALL,
  // preserving declaration order (the page does `SHOWCASE_ENTRIES.filter(isRealRoute)`).
  const rendered = SHOWCASE_ENTRIES.filter((e) => isRealRoute(e.href))
  assert.deepEqual(
    rendered,
    SHOWCASE_ENTRIES,
    'every shipped showcase entry must survive the real-route filter, in order'
  )
  rendered.forEach((entry, i) => {
    assert.equal(entry, SHOWCASE_ENTRIES[i], `declared order must be preserved at index ${i}`)
    assert.ok(isValidShowcaseEntry(entry), `shipped entry must be well-formed: ${entry.href}`)
  })

  // Req 4.5 — an entry whose href is not a real route is omitted by the page
  // filter and rejected by the validator the renderer relies on, while every
  // valid sibling still renders in order.
  fc.assert(
    fc.property(badHrefArb, titleArb, descriptionArb, (href, title, description) => {
      const badEntry: ShowcaseEntry = { href, title, description }
      const manifestWithBad = [...SHOWCASE_ENTRIES, badEntry]

      const renderedList = manifestWithBad.filter((e) => isRealRoute(e.href))

      // The bad entry is omitted from rendered output...
      assert.ok(!renderedList.includes(badEntry), `bad-href entry must be omitted: "${href}"`)
      // ...the validator agrees it is invalid (bad route ⇒ invalid regardless of title/desc)...
      assert.equal(
        isValidShowcaseEntry(badEntry),
        false,
        `validator must reject non-real-route entry: "${href}"`
      )
      // ...and every valid sibling still renders, in declared order.
      assert.deepEqual(renderedList, SHOWCASE_ENTRIES, 'remaining valid entries must still render in order')
    }),
    { numRuns: 200 }
  )
})

// ===========================================================================
// Req 5.2 — empty / '#' / anchor-only hrefs fail validation with a surfaced error
// ===========================================================================
test('Req 5.2: empty, "#", and anchor-only hrefs fail validation and surface an identifying error', () => {
  fc.assert(
    fc.property(placeholderHrefArb, (href) => {
      assert.equal(isResolvableHref(href), false, `placeholder href must be unresolvable: "${href}"`)

      const errors = surfaceLinkErrors(href)
      assert.ok(errors.length >= 1, `placeholder href must surface an error: "${href}"`)
      // The error identifies the offending href (non-empty placeholders embed the value).
      if (href.length > 0) {
        assert.ok(
          errors.some((e) => e.includes(href)),
          `surfaced error must identify the offending href: "${href}"`
        )
      }
    }),
    { numRuns: 100 }
  )
})

// ===========================================================================
// Req 5.4 — targets not equal to a member of EXISTING_ROUTES fail with a surfaced error
// ===========================================================================
test('Req 5.4: a target not in EXISTING_ROUTES fails validation and surfaces an identifying error', () => {
  fc.assert(
    fc.property(fakeRouteArb, (target) => {
      assert.equal(isRealRoute(target), false, `fake route must not be a real route: "${target}"`)
      assert.equal(isResolvableHref(target), false, `fake route must be unresolvable: "${target}"`)

      const errors = surfaceLinkErrors(target)
      assert.ok(errors.length >= 1, `non-route target must surface an error: "${target}"`)
      assert.ok(
        errors.some((e) => e.includes(target)),
        `surfaced error must identify the offending target: "${target}"`
      )
    }),
    { numRuns: 200 }
  )
})

// ===========================================================================
// Req 6.2 — EXCLUDED_PATTERNS targets are rejected with a surfaced error
// ===========================================================================
test('Req 6.2: an excluded-pattern target is rejected from rendered output and surfaces an identifying error', () => {
  fc.assert(
    fc.property(excludedTargetArb, (target) => {
      assert.equal(matchesExcludedPattern(target), true, `target must match an excluded pattern: "${target}"`)

      const errors = surfaceLinkErrors(target)
      assert.ok(errors.length >= 1, `excluded target must surface a validation error: "${target}"`)
      // The first surfaced reason names it specifically as an excluded rejection.
      assert.ok(
        errors.some((e) => e.includes('excluded') && e.includes(target)),
        `surfaced error must identify the rejected excluded target: "${target}"`
      )
      // Rejected ⇒ never rendered.
      const renders = surfaceLinkErrors(target).length === 0
      assert.equal(renders, false, `excluded target must not render: "${target}"`)
    }),
    { numRuns: 200 }
  )
})

// ===========================================================================
// Positive guard — what the manifest actually ships renders with zero errors
// ===========================================================================
test('Req 5.2/5.4/6.2: every shipped CTA/showcase target renders with no surfaced errors', () => {
  for (const target of [...CTA_TARGETS.map((c) => c.href), ...SHOWCASE_ENTRIES.map((e) => e.href)]) {
    assert.deepEqual(surfaceLinkErrors(target), [], `shipped target must render cleanly: ${target}`)
  }
})
