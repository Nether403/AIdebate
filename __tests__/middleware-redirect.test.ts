// Feature: showcase-redesign, Task 6.3: excluded-route redirect guard.
//
// Asserts the REAL root `middleware.ts` behaviour at the logic level: an
// excluded path is never rendered (it is redirected) and resolves to an
// approved, exposed destination (`/showcase`); approved paths pass through.
//
// Validates: Requirements 6.5
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'
import { EXCLUDED_PATTERNS } from '@/lib/design-system/manifest'

const APPROVED_DESTINATION = '/showcase'
const ORIGIN = 'https://example.test'

/** Run the real middleware against a path and return its response. */
function run(path: string) {
  return middleware(new NextRequest(new URL(`${ORIGIN}${path}`)))
}

/** True iff the response is an HTTP redirect whose Location resolves to /showcase. */
function redirectsToShowcase(path: string): boolean {
  const res = run(path)
  const isRedirect = res.status === 307 || res.status === 308
  const loc = res.headers.get('location')
  return isRedirect && loc !== null && new URL(loc).pathname === APPROVED_DESTINATION
}

// Concrete excluded paths — one per non-goal pattern (prediction markets,
// betting/points, badges, social-share/follow, leaderboards, virality).
const excludedPaths = [
  '/leaderboard',
  '/prediction-market',
  '/debate-betting',
  '/superforecaster',
  '/share/x',
  '/points',
  '/follow',
  '/viral',
]

// Approved, real routes from the navigation contract — must pass through.
const approvedPaths = ['/', '/showcase', '/debate/new', '/health']

test('Task 6.3: excluded paths are not rendered and redirect to the approved /showcase destination', () => {
  for (const path of excludedPaths) {
    assert.ok(
      redirectsToShowcase(path),
      `excluded path "${path}" must redirect to ${APPROVED_DESTINATION}, not render its content`
    )
  }
})

test('Task 6.3: approved paths pass through (no redirect to /showcase)', () => {
  for (const path of approvedPaths) {
    assert.ok(
      !redirectsToShowcase(path),
      `approved path "${path}" must pass through, not be redirected to ${APPROVED_DESTINATION}`
    )
  }
})

test('Task 6.3: the approved destination itself does not loop', () => {
  // /showcase matches no excluded pattern, so guarding it cannot create a
  // redirect loop back onto itself.
  assert.ok(!redirectsToShowcase(APPROVED_DESTINATION), '/showcase must not redirect to itself')
})

test('Task 6.3: any generated path embedding an excluded term redirects to /showcase', () => {
  // Build a path that is guaranteed to contain an excluded term, surrounded by
  // arbitrary url-safe segments. Whatever the noise, the guard must redirect.
  const segment = fc.stringMatching(/^[a-z0-9-]{0,12}$/)
  const excludedTerm = fc.constantFrom(
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
    'virality',
    'viral'
  )

  fc.assert(
    fc.property(segment, excludedTerm, segment, (pre, term, post) => {
      // Slash-separate the term so word-boundary patterns (e.g. \bpoints\b,
      // \bfollow\b) tokenize it as a standalone word regardless of the noise
      // segments — otherwise an adjacent word char (e.g. "0points") legitimately
      // defeats the boundary and the guard correctly would not fire.
      const path = `/${pre}/${term}/${post}`
      assert.ok(
        redirectsToShowcase(path),
        `path "${path}" embeds excluded term "${term}" and must redirect to ${APPROVED_DESTINATION}`
      )
    }),
    { numRuns: 200 }
  )
})

test('Task 6.3: EXCLUDED_PATTERNS is the source of truth the guard enforces', () => {
  // Independent oracle: the middleware redirects a path exactly when that path
  // matches some EXCLUDED_PATTERN — tying the route guard to the manifest.
  const realRoutes = ['/', '/showcase', '/debate/new', '/debate/example', '/health']
  const pathArb = fc.oneof(
    fc.constantFrom(...realRoutes, ...excludedPaths),
    fc.stringMatching(/^\/[a-z0-9/-]{0,20}$/)
  )

  fc.assert(
    fc.property(pathArb, (path) => {
      const expected = EXCLUDED_PATTERNS.some((p) => p.test(path))
      assert.equal(redirectsToShowcase(path), expected, `guard decision mismatch for "${path}"`)
    }),
    { numRuns: 200 }
  )
})
