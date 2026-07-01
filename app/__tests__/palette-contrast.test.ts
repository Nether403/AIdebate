// Feature: app-redesign, Task 1.3 — Property 4: Palette floor.
//
// Validates: Requirements 9.1
//   "FOR ALL documented foreground, background, and role token pairs in both
//    the dark and light themes, THE Design_System SHALL provide a contrast
//    ratio of at least 4.5:1 for normal text and at least 3:1 for large text
//    (>=24px, or >=18.66px bold) and non-text."
//
// This is a table-driven fast-check property over the documented (fg, bg, role)
// token pairs. The token values are read from the REAL source of truth,
// app/globals.css (the shadcn New York contract themed cool near-black +
// cyan->violet), so the test fails if the palette drifts below the WCAG floor.
//
// Self-contained on purpose: the legacy lib/design-system/tokens.ts helper is
// retired later in this spec (tasks 11.1/11.2), and the palette-floor property
// must outlive it. The WCAG math + rgba compositing live here.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// --- Load the real token contract ------------------------------------------
const GLOBALS_PATH = fileURLToPath(new URL('../globals.css', import.meta.url))
const CSS = readFileSync(GLOBALS_PATH, 'utf8')

/**
 * Extract `--name: value;` declarations from the body of a CSS rule whose
 * selector list matches `selectorRe`. Returns a name->value map (names keep
 * their leading `--`). Comments inside values are stripped.
 */
function parseBlock(selectorRe: RegExp): Record<string, string> {
  const match = CSS.match(selectorRe)
  if (!match) throw new Error(`could not find CSS block for ${selectorRe}`)
  const body = match[1]
  const out: Record<string, string> = {}
  for (const decl of body.split(';')) {
    const m = decl.match(/(--[a-z0-9-]+)\s*:\s*([^;]+)/i)
    if (!m) continue
    out[m[1]] = m[2].replace(/\/\*[\s\S]*?\*\//g, '').trim()
  }
  return out
}

// Dark is the default + complete block (`:root, .dark`); light overrides color
// tokens, so the light theme is the dark map with the `.light` overrides on top.
const DARK = parseBlock(/:root,\s*\.dark\s*\{([\s\S]*?)\}/)
const LIGHT = { ...DARK, ...parseBlock(/\.light\s*\{([\s\S]*?)\}/) }
const THEMES = { dark: DARK, light: LIGHT } as const

// --- Color parsing + WCAG 2.1 contrast (with rgba compositing) -------------
interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

function parseColor(value: string): Rgba {
  const v = value.trim()
  if (v.startsWith('#')) {
    let hex = v.slice(1)
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
    if (hex.length !== 6) throw new Error(`unsupported hex: ${value}`)
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    }
  }
  const m = v.match(/rgba?\(([^)]+)\)/i)
  if (m) {
    const p = m[1].split(',').map((s) => parseFloat(s.trim()))
    if (p.length >= 3 && p.slice(0, 3).every(Number.isFinite)) {
      return { r: p[0], g: p[1], b: p[2], a: p.length >= 4 ? p[3] : 1 }
    }
  }
  throw new Error(`unsupported color: ${value}`)
}

/** Alpha-composite `src` over opaque `dst` (src-over). */
function composite(src: Rgba, dst: Rgba): Rgba {
  const a = src.a
  return {
    r: src.r * a + dst.r * (1 - a),
    g: src.g * a + dst.g * (1 - a),
    b: src.b * a + dst.b * (1 - a),
    a: 1,
  }
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const lin = (raw: number) => {
    const c = raw / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG 2.1 contrast ratio in [1, 21]; order-independent. */
function contrastRatio(fg: Rgba, bg: Rgba): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

type ThemeMode = keyof typeof THEMES
type Role = 'body' | 'large' | 'non-text'

const MIN_CONTRAST: Record<Role, number> = {
  body: 4.5, // normal text
  large: 3, // large text (>=24px, or >=18.66px bold)
  'non-text': 3, // focus ring, status dots, accent emphasis
}

/** Resolve a token to its effective on-screen color for the theme. A
 *  translucent surface is composited over the opaque page `--background`,
 *  matching how the glass panels actually render over the page. */
function resolve(name: string, theme: ThemeMode, asSurface: boolean): Rgba {
  const map = THEMES[theme]
  const raw = map[name]
  assert.ok(raw, `${theme}: token ${name} is not defined in globals.css`)
  const color = parseColor(raw)
  if (asSurface && color.a < 1) {
    return composite(color, parseColor(map['--background']))
  }
  return color
}

interface Pairing {
  theme: ThemeMode
  role: Role
  fg: string
  bg: string
}

/**
 * The documented foreground/background/role token pairs the Design_System
 * relies on, enumerated for both themes. `fg`/`bg` are token names from
 * globals.css. Keep this in lock-step with real component usage.
 */
const PAIRINGS: readonly Pairing[] = (['dark', 'light'] as const).flatMap(
  (theme) => [
    // body text over each surface
    { theme, role: 'body', fg: '--foreground', bg: '--background' },
    { theme, role: 'body', fg: '--card-foreground', bg: '--card' },
    { theme, role: 'body', fg: '--popover-foreground', bg: '--popover' },
    { theme, role: 'body', fg: '--sidebar-foreground', bg: '--sidebar' },
    // muted / secondary text over surfaces
    { theme, role: 'body', fg: '--muted-foreground', bg: '--background' },
    { theme, role: 'body', fg: '--muted-foreground', bg: '--card' },
    // button label on the primary accent fill
    { theme, role: 'body', fg: '--primary-foreground', bg: '--primary' },
    // non-text: accent emphasis + focus ring against their surfaces
    { theme, role: 'non-text', fg: '--primary', bg: '--background' },
    { theme, role: 'non-text', fg: '--ring', bg: '--card' },
    // non-text: status / severity dots against the page
    { theme, role: 'non-text', fg: '--status-low', bg: '--background' },
    { theme, role: 'non-text', fg: '--status-elevated', bg: '--background' },
    { theme, role: 'non-text', fg: '--status-high', bg: '--background' },
  ]
)

function assertMeetsFloor(p: Pairing): void {
  const fg = resolve(p.fg, p.theme, false)
  const bg = resolve(p.bg, p.theme, true)
  const ratio = contrastRatio(fg, bg)
  const min = MIN_CONTRAST[p.role]
  assert.ok(
    ratio >= min,
    `${p.theme}/${p.role}: ${p.fg} on ${p.bg} had contrast ` +
      `${ratio.toFixed(2)}:1, below required ${min}:1`
  )
}

// --- Property 4: Palette floor ---------------------------------------------
test('Property 4: documented token pairs meet the WCAG contrast floor (Req 9.1)', () => {
  fc.assert(
    fc.property(fc.constantFrom(...PAIRINGS), assertMeetsFloor),
    { numRuns: 100 }
  )

  // The pairing set is finite; random sampling could skip an entry, so assert
  // the invariant exhaustively over every documented pair as well.
  for (const p of PAIRINGS) assertMeetsFloor(p)
})
