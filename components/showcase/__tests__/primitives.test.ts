// Feature: showcase-redesign, Task 4.6 — unit tests for primitive behavior.
//
// Covers, at the pure-logic level the components expose (the repo has no DOM
// test harness — node:test + fast-check only, see tests/run-unit-tests.ts):
//   1. CtaButton primary/secondary visual distinction (Req 3.4)
//   2. Infographic error fallback renders the manifest alt text (Req 11.5)
//   3. SimulatorControls starts paused under reduced motion (Req 9.7) and
//      invokes onToggle synchronously so a pause stops within 100ms (Req 9.4)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { CTA_VARIANT_CLASSES } from '../CtaButton'
import { infographicFallbackText } from '../Infographic'
import { SimulatorControls, initialPlaying } from '../SimulatorControls'
import {
  BRAND_IMAGES,
  INFORMATIONAL_ALT_MIN,
  INFORMATIONAL_ALT_MAX,
} from '@/lib/design-system/manifest'

const tokens = (classes: string): Set<string> => new Set(classes.split(/\s+/).filter(Boolean))

// --- 1. CtaButton primary/secondary visual distinction (Req 3.4) -----------
//
// The secondary variant must reuse NONE of the primary's three emphasis axes:
// fill (bg-accent-primary), size (text-body), weight (font-bold). Assert on the
// exported class source so the test reflects the REAL rendered output, and use
// exact-token matching so `hover:bg-accent-primary/10` is not mistaken for the
// solid `bg-accent-primary` fill.
test('CtaButton: secondary reuses none of primary fill/size/weight (Req 3.4)', () => {
  const primary = tokens(CTA_VARIANT_CLASSES.primary)
  const secondary = tokens(CTA_VARIANT_CLASSES.secondary)

  // Primary defines all three emphasis axes.
  assert.ok(primary.has('bg-accent-primary'), 'primary should have solid accent fill')
  assert.ok(primary.has('text-body'), 'primary should use text-body size')
  assert.ok(primary.has('font-bold'), 'primary should use font-bold weight')

  // Secondary reuses none of them (differs on every axis).
  assert.ok(!secondary.has('bg-accent-primary'), 'secondary must not reuse primary fill')
  assert.ok(!secondary.has('text-body'), 'secondary must not reuse primary size')
  assert.ok(!secondary.has('font-bold'), 'secondary must not reuse primary weight')

  // And secondary positively differs (its own distinct axes).
  assert.ok(secondary.has('bg-transparent'), 'secondary fill is transparent')
  assert.ok(secondary.has('text-caption'), 'secondary size is text-caption')
  assert.ok(secondary.has('font-medium'), 'secondary weight is font-medium')
})

// --- 2. Infographic error fallback (Req 11.5) ------------------------------
//
// On image-fetch failure the component renders the manifest alt as visible text
// (never a broken-image element). Assert the fallback text equals the manifest
// INFOGRAPHIC entry's alt and is a non-empty informational alt (1..250 chars).
test('Infographic: error fallback is the manifest alt, within informational bounds (Req 11.5)', () => {
  const manifestAlt = BRAND_IMAGES.find((img) => img.src === '/infographic.jpg')?.alt
  const fallback = infographicFallbackText()

  assert.equal(fallback, manifestAlt, 'fallback text must equal the manifest infographic alt')
  assert.ok(fallback.length >= INFORMATIONAL_ALT_MIN, 'fallback alt must be non-empty')
  assert.ok(fallback.length <= INFORMATIONAL_ALT_MAX, 'fallback alt must be within 250 chars')
})

// --- 3a. SimulatorControls starts paused under reduced motion (Req 9.7) ----
test('SimulatorControls: starts paused under reduced motion, playing otherwise (Req 9.7)', () => {
  assert.equal(initialPlaying(true), false, 'reduced motion → starts paused')
  assert.equal(initialPlaying(false), true, 'no reduced-motion preference → auto-advances')

  // initialPlaying is the pure inverse of the reduced-motion flag, for all inputs.
  fc.assert(
    fc.property(fc.boolean(), (reducedMotion) => {
      assert.equal(initialPlaying(reducedMotion), !reducedMotion)
    }),
    { numRuns: 100 }
  )
})

// --- 3b. Pause invokes onToggle synchronously (stops within 100ms, Req 9.4) -
//
// SimulatorControls is a controlled component: the parent owns the auto-advance
// timer and `playing`. The 100ms-stop guarantee rests on the control invoking
// `onToggle` SYNCHRONOUSLY with no internal timer/debounce. Inspect the React
// element it returns (a plain object — no DOM needed): the button's onClick must
// be the onToggle reference, and invoking it must call onToggle exactly once
// synchronously. Also assert the paused indicator is present iff not playing.
function childArray(element: { props: { children: unknown } }): unknown[] {
  const c = element.props.children
  return Array.isArray(c) ? c : [c]
}

test('SimulatorControls: pause invokes onToggle synchronously, shows paused indicator (Req 9.4)', () => {
  // playing=true: button wired to onToggle, no paused indicator.
  let calls = 0
  const onToggle = () => {
    calls++
  }
  const playingEl = SimulatorControls({ playing: true, onToggle }) as {
    props: { children: unknown }
  }
  const playingChildren = childArray(playingEl)
  const button = playingChildren[0] as { props: { onClick: () => void } }

  assert.equal(
    button.props.onClick,
    onToggle,
    'button onClick must be the onToggle reference (synchronous, no wrapper/debounce)'
  )
  button.props.onClick()
  assert.equal(calls, 1, 'invoking the control calls onToggle exactly once, synchronously')

  // No paused indicator while playing (children[1] is falsy via `!playing && ...`).
  assert.ok(!playingChildren[1], 'no paused indicator while playing')

  // playing=false: a visible paused indicator (role="status") is present.
  const pausedEl = SimulatorControls({ playing: false, onToggle: () => {} }) as {
    props: { children: unknown }
  }
  const indicator = childArray(pausedEl)[1] as { props: { role?: string } } | undefined
  assert.ok(indicator && typeof indicator === 'object', 'paused indicator rendered when paused')
  assert.equal(indicator.props.role, 'status', 'paused indicator exposes role="status"')
})
