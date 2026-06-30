// Feature: showcase-redesign, Task 8.3 — example test for hub entries and the
// navigation-failure error state.
//
// Asserts (a) every SHOWCASE_ENTRIES entry renders as a navigable card on the
// Showcase_Hub — i.e. each maps to a real route and to a `next/link` carrying
// an `href` + `aria-label` (Req 4.1) — and (b) a failed demo navigation keeps
// the visitor on the hub with a visible error, never navigating away, with the
// `app/showcase/error.tsx` boundary as the async backstop (Req 4.7).
//
// The repo has no DOM test harness (node:test + fast-check only — see
// tests/run-unit-tests.ts), so the rendering/error CONTRACT is verified two
// ways: manifest-driven invariants over SHOWCASE_ENTRIES (what the renderer
// maps) and static-source analysis of the two components that own the contract.
//
// Validates: Requirements 4.1, 4.7
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  SHOWCASE_ENTRIES,
  isRealRoute,
  isValidShowcaseEntry,
} from '@/lib/design-system/manifest'

const here = dirname(fileURLToPath(import.meta.url)) // components/showcase/__tests__
const hubCardsSrc = readFileSync(join(here, '..', 'ShowcaseHubCards.tsx'), 'utf8')
const errorSrc = readFileSync(join(here, '..', '..', '..', 'app', 'showcase', 'error.tsx'), 'utf8')

// --- (a) Every entry renders as a navigable card (Req 4.1) -----------------
//
// Manifest invariant: the registry the hub maps is non-empty and every entry
// is a well-formed, real-route destination — the precondition for a navigable
// card (a Link to a route that actually resolves, not a "#"/placeholder).
test('Task 8.3: every SHOWCASE_ENTRIES entry is a navigable real-route card (Req 4.1)', () => {
  assert.ok(SHOWCASE_ENTRIES.length > 0, 'the hub must render at least one demo entry')
  for (const entry of SHOWCASE_ENTRIES) {
    assert.ok(isValidShowcaseEntry(entry), `entry must be well-formed: ${entry.href}`)
    assert.ok(isRealRoute(entry.href), `entry href must resolve to a real route: ${entry.href}`)
  }
})

// Rendering contract: ShowcaseHubCards maps the typed registry (never a
// hard-coded list) onto a real `next/link` carrying both the destination href
// and the title as an accessible name — that is what makes each card navigable.
test('Task 8.3: hub maps SHOWCASE_ENTRIES to Links with href + aria-label (Req 4.1)', () => {
  assert.match(
    hubCardsSrc,
    /SHOWCASE_ENTRIES.*from\s+['"]@\/lib\/design-system\/manifest['"]/s,
    'hub must source its cards from the typed SHOWCASE_ENTRIES registry'
  )
  assert.match(hubCardsSrc, /SHOWCASE_ENTRIES\.map\(/, 'hub must render one card per registry entry')
  assert.match(hubCardsSrc, /<Link\b/, 'each card must be a next/link')
  assert.match(hubCardsSrc, /href=\{entry\.href\}/, 'each card Link must target the entry href')
  assert.match(
    hubCardsSrc,
    /aria-label=\{entry\.title\}/,
    'each card Link must expose the title as its accessible name'
  )
})

// --- (b) Failed navigation stays on the hub with a visible error (Req 4.7) -
//
// The on-hub half: a caught navigation failure surfaces a visible role="alert"
// banner and must NOT navigate away. We assert the catch sets the error state
// and performs no router navigation (the single router.push lives in the try,
// before the catch), so the visitor is never moved off the hub.
test('Task 8.3: caught navigation failure shows a role="alert" and does not leave the hub (Req 4.7)', () => {
  assert.match(hubCardsSrc, /role="alert"/, 'a visible error must use role="alert"')

  const catchIndex = hubCardsSrc.indexOf('catch')
  assert.ok(catchIndex !== -1, 'navigation must be guarded by a try/catch')

  const pushMatches = hubCardsSrc.match(/router\.(push|replace)\s*\(/g) ?? []
  assert.equal(pushMatches.length, 1, 'exactly one programmatic navigation (in the guarded try)')
  const pushIndex = hubCardsSrc.search(/router\.(push|replace)\s*\(/)
  assert.ok(pushIndex < catchIndex, 'the navigation call must sit in the try, before the catch')

  const catchBody = hubCardsSrc.slice(catchIndex)
  assert.match(catchBody, /setFailedTitle\(/, 'the catch must set the visible error state')
  assert.doesNotMatch(
    catchBody,
    /router\.(push|replace)\s*\(/,
    'the catch must NOT navigate away — the visitor stays on the hub'
  )
})

// The async backstop half: app/showcase/error.tsx renders a "couldn't open" /
// "went wrong" message and a return link to the hub, so an async destination
// failure also resolves to a visible error rather than a blank/broken view.
test('Task 8.3: showcase error boundary shows a failure message and a back-to-showcase link (Req 4.7)', () => {
  assert.ok(
    /couldn.?t open/i.test(errorSrc) || /went wrong/i.test(errorSrc),
    'error boundary must show a "couldn\'t open" / "went wrong" message'
  )
  assert.match(errorSrc, /href="\/showcase"/, 'error boundary must link back to the hub')
})
