// Feature: app-redesign, Task 12.2 — Property 8: Reduced-motion safety.
//
// Validates: Requirements 12.1, 12.2, 12.3
//   12.1 Under prefers-reduced-motion: reduce, suppress element transitions and
//        animations (no perceptible position/scale/opacity change).
//   12.2 Under reduced motion, every element that would otherwise animate into
//        view renders directly in its final visible & interactive state
//        (nothing hidden/deferred pending an animation).
//   12.3 Under reduced motion, stop all continuously looping / auto-playing
//        decorative animations.
//
// This repo has no DOM / browser harness — the unit suite is node:test +
// fast-check over the REAL source files (see tests/run-unit-tests.ts and the
// sibling app/__tests__/palette-contrast.test.ts, which parses globals.css). So
// Property 8 is enforced statically against the actual source of truth:
//
//   (A) globals.css ships the global guarantee: a
//       `@media (prefers-reduced-motion: reduce)` rule that, on the universal
//       selector (*, *::before, *::after), disables `animation` AND `transition`
//       with `!important`. This is the CSS-level kill switch for 12.1 + 12.3 —
//       every CSS animation/transition on every node is suppressed.
//
//   (B) JS-driven motion (Framer Motion) is NOT stopped by that CSS rule (it
//       animates inline styles via rAF), so 12.2's "content must not stay hidden
//       pending an animation" is the real risk vector. We assert that every
//       in-scope redesigned surface that imports framer-motion gates its motion
//       on `useReducedMotion()` — i.e. there is no reveal that can leave content
//       invisible under reduced motion without a guard.
//
//   (C) The one in-scope page that gates content behind a timed sequence
//       (the live-debate progressive transcript reveal) renders its first turn
//       immediately (final visible state, 12.2) and starts the auto-advance
//       PAUSED under reduced motion (12.3).
//
// ponytail: scope mirrors the sibling static scan (__tests__/showcase-static-scan.ts):
// the redesigned Design_System surfaces = the fixed page files + components/showcase/*.
// The legacy product-era framer-motion components (components/layout/{Tabs,
// PageTransition,Card,Toast}.tsx, components/debate/DebateTranscript.tsx) are NOT
// redesigned surfaces and — except Toast's global provider, a transient
// notification rather than deferred above-the-fold content — are not even
// imported by any in-scope page. Ceiling: if a legacy reveal component is ever
// adopted into a redesigned surface, add it to IN_SCOPE_SURFACES and it must
// then carry a useReducedMotion guard to pass.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = process.cwd()
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8')

// --- (A) Global CSS guarantee (Req 12.1, 12.3) ------------------------------
const CSS = read('app/globals.css')

/**
 * Extract the universal-selector rule nested inside the
 * `@media (prefers-reduced-motion: reduce)` block. Returns the selector list and
 * the declaration body, or null if the block/rule is absent.
 */
function reducedMotionRule(): { selector: string; decls: string } | null {
  const m = CSS.match(
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{\s*([^{]*?)\{([^}]*)\}/
  )
  if (!m) return null
  return { selector: m[1].trim(), decls: m[2].trim() }
}

test('Property 8 (A): globals.css disables animation+transition under reduced motion (Req 12.1, 12.3)', () => {
  const rule = reducedMotionRule()
  assert.ok(
    rule,
    'globals.css must contain a `@media (prefers-reduced-motion: reduce)` block with a universal-selector rule'
  )

  // The kill switch must target every node + pseudo-element.
  for (const sel of ['*', '*::before', '*::after']) {
    assert.ok(
      rule!.selector.includes(sel),
      `reduced-motion rule must apply to the universal selector \`${sel}\`, got "${rule!.selector}"`
    )
  }

  // Both animation AND transition must be forced off with !important so no
  // CSS-level motion (12.1) or looping/auto-playing decoration (12.3) survives.
  const animOff = /animation\s*:\s*none\s*!important/i.test(rule!.decls)
  const transOff = /transition\s*:\s*none\s*!important/i.test(rule!.decls)
  assert.ok(animOff, `reduced-motion rule must set \`animation: none !important\`, got "${rule!.decls}"`)
  assert.ok(transOff, `reduced-motion rule must set \`transition: none !important\`, got "${rule!.decls}"`)
})

// --- in-scope redesigned surfaces (same set the static scan governs) --------
const PAGE_FILES = [
  'app/page.tsx',
  'app/showcase/page.tsx',
  'app/showcase/live-debate/page.tsx',
  'app/showcase/eval-report/page.tsx',
  'app/showcase/regression-gate/page.tsx',
  'app/showcase/steelman/page.tsx',
  'app/showcase/synthetic-data/page.tsx',
] as const

function showcaseComponentFiles(): string[] {
  const dir = 'components/showcase'
  return readdirSync(resolve(ROOT, dir))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => join(dir, f))
}

const IN_SCOPE_SURFACES: readonly string[] = [...PAGE_FILES, ...showcaseComponentFiles()]

// --- (B) Property: in-scope framer-motion usage is reduced-motion-guarded (Req 12.2)
//
// For every in-scope surface, IF it imports from 'framer-motion' THEN it must
// reference `useReducedMotion`. Framer Motion drives inline-style animation that
// the CSS kill switch (A) does NOT stop, so an unguarded `initial` reveal could
// leave content stuck invisible under reduced motion — exactly what 12.2 forbids.
function importsFramerMotion(src: string): boolean {
  return /from\s*['"]framer-motion['"]/.test(src)
}
function guardsReducedMotion(src: string): boolean {
  return /useReducedMotion/.test(src)
}

function assertGuarded(file: string): void {
  const src = read(file)
  if (!importsFramerMotion(src)) return // no JS motion → CSS rule (A) fully covers it
  assert.ok(
    guardsReducedMotion(src),
    `${file} imports framer-motion but never references useReducedMotion — a JS reveal can hide content under reduced motion (Req 12.2)`
  )
}

test('Property 8 (B): in-scope framer-motion surfaces honor useReducedMotion (Req 12.2)', () => {
  fc.assert(
    fc.property(fc.constantFrom(...IN_SCOPE_SURFACES), assertGuarded),
    { numRuns: 100 }
  )
  // Finite set — sample exhaustively so no surface is skipped.
  for (const file of IN_SCOPE_SURFACES) assertGuarded(file)
})

// --- (C) The one timed reveal: first turn visible + paused under reduced motion
//
// The live-debate page progressively reveals transcript turns on a timer. 12.2
// requires above-the-fold content to render in its final visible state, and 12.3
// requires the auto-advancing sequence to be stopped under reduced motion.
test('Property 8 (C): live-debate first turn is always visible and auto-advance pauses under reduced motion (Req 12.2, 12.3)', () => {
  const src = read('app/showcase/live-debate/page.tsx')

  // First turn rendered immediately: the visible-turn counter starts >= 1, so
  // the slice `sampleTurns.slice(0, visibleTurns)` is never empty on first paint.
  const initMatch = src.match(/useState\(\s*(\d+)\s*\)/)
  assert.ok(initMatch, 'live-debate must seed the visible-turn counter with a numeric useState initial')
  assert.ok(
    Number(initMatch![1]) >= 1,
    `live-debate must render the first turn immediately (visibleTurns initial >= 1), got ${initMatch![1]} (Req 12.2)`
  )

  // Auto-advance is suppressed under reduced motion: playing is bound to the
  // negation of the reduced-motion preference until the visitor takes control.
  assert.ok(
    /useReducedMotion\(\)/.test(src),
    'live-debate must read useReducedMotion() to gate the auto-advance (Req 12.3)'
  )
  assert.ok(
    /setPlaying\(\s*!\s*reducedMotion\s*\)/.test(src),
    'live-debate must start the auto-advance paused under reduced motion (setPlaying(!reducedMotion)) (Req 12.3)'
  )
})
