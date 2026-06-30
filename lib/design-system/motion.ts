// Feature: showcase-redesign — reduced-motion-aware Framer Motion variant builder.
//
// Token *values* live in exactly one place: the `@theme` block in app/globals.css
// (e.g. `--duration-entrance`, `--duration-opacity`). This module reads those
// custom properties via `getMotionToken()` and enforces the motion-discipline
// ceilings from Requirement 9 (9.1 reduced-motion opacity-only <=200ms,
// 9.6 entrance <=600ms, 9.7 reduced-motion stops positional/scale motion).
//
// `buildVariant` is a PURE function of (kind, reducedMotion): for a fixed token
// environment it always returns the same spec, never mutates input, and is total
// (every kind + reduced-motion pair yields a defined, bounded spec). It is
// property-tested with fast-check in task 2.5.

export interface MotionSpec {
  opacity?: [number, number]
  y?: [number, number]
  scale?: [number, number]
  durationMs: number
}

export type VariantKind = 'entrance' | 'emphasis' | 'hover'

/** Hard ceilings from Requirement 9 — enforced regardless of token values. */
const ENTRANCE_CEILING_MS = 600 // Req 9.6
const REDUCED_MOTION_CEILING_MS = 200 // Req 9.1

/**
 * Safe numeric fallbacks (milliseconds) used when CSS custom properties cannot
 * be read (Node/SSR/tests where `getComputedStyle` is unavailable). These mirror
 * the canonical globals.css `@theme` values.
 *
 * ponytail: fallback constants duplicate the globals.css durations only as a
 * total-function safety net; the real ceiling is enforced below by `buildVariant`
 * (entrance clamped to <=600ms, reduced/opacity clamped to <=200ms), so a token
 * drifting above its ceiling can never produce an out-of-spec animation.
 */
const FALLBACK_MS: Readonly<Record<string, number>> = {
  '--duration-entrance': 500,
  '--duration-opacity': 200,
}

/** Parse a CSS duration string (`"600ms"`, `"0.6s"`, `"600"`) into milliseconds. */
function parseDurationMs(value: string): number | null {
  const match = value.trim().match(/^([\d.]+)\s*(ms|s)?$/)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null
  return match[2] === 's' ? amount * 1000 : amount
}

/**
 * Read a motion-duration token (in ms) from the single CSS source of truth.
 * Falls back to the matching globals.css value when running outside a browser
 * (SSR, unit/property tests) so callers always receive a finite number.
 */
export function getMotionToken(name: string): number {
  if (typeof window !== 'undefined' && typeof getComputedStyle === 'function') {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name)
    const parsed = parseDurationMs(raw)
    if (parsed !== null) return parsed
  }
  return FALLBACK_MS[name] ?? 0
}

/**
 * Build a reduced-motion-aware animation spec.
 *
 * - Always: entrance/emphasis durations are clamped to <=600ms (Req 9.6).
 * - When `reducedMotion` is true: the spec animates OPACITY ONLY — no `y`
 *   (positional), no `scale`, no rotation — with duration <=200ms (Req 9.1, 9.7).
 */
export function buildVariant(kind: VariantKind, reducedMotion: boolean): MotionSpec {
  if (reducedMotion) {
    return {
      opacity: [0, 1],
      durationMs: Math.min(getMotionToken('--duration-opacity'), REDUCED_MOTION_CEILING_MS),
    }
  }

  const entranceMs = Math.min(getMotionToken('--duration-entrance'), ENTRANCE_CEILING_MS)

  switch (kind) {
    case 'entrance':
      return { opacity: [0, 1], y: [12, 0], durationMs: entranceMs }
    case 'emphasis':
      return { opacity: [0.7, 1], scale: [0.97, 1], durationMs: entranceMs }
    case 'hover':
      return {
        scale: [1, 1.02],
        durationMs: Math.min(getMotionToken('--duration-opacity'), REDUCED_MOTION_CEILING_MS),
      }
  }
}
