/**
 * Design_System — typed token layer (names + resolution + contrast).
 *
 * Canonical CSS values live in `app/globals.css @theme` (single source of truth
 * for the browser). This module mirrors those values into a typed map so the
 * resolver can be a *total* function and so the contrast invariant is testable
 * without a DOM. The two must stay in sync; the property tests (Properties 1 & 2)
 * and the build-time category check guard against drift.
 *
 * Requirements: 1.5 (≤1 primary + ≤3 supporting accents), 2.6 / 8.3 / 10.1
 * (WCAG contrast), 10.2 / 10.4 (theme-scoped tokens, total resolution with
 * dark-theme fallback).
 */

// ---------------------------------------------------------------------------
// Token categories and accent allow-list
// ---------------------------------------------------------------------------

export const TOKEN_CATEGORIES = [
  'color',
  'glow',
  'typography',
  'spacing',
  'radius',
  'elevation',
  'motion',
] as const

export type TokenCategory = (typeof TOKEN_CATEGORIES)[number]

/** At most one primary accent plus three supporting accents (Requirement 1.5). */
export const ACCENT_TOKENS = {
  primary: 'accent-primary',
  supporting: ['accent-2', 'accent-3', 'accent-4'],
} as const

export type AccentToken =
  | typeof ACCENT_TOKENS.primary
  | (typeof ACCENT_TOKENS.supporting)[number]

export type ThemeMode = 'light' | 'dark'

/** The default theme used as the resolution fallback (Requirement 10.4). */
export const DEFAULT_THEME: ThemeMode = 'dark'

// ---------------------------------------------------------------------------
// Canonical token values (mirror of app/globals.css @theme)
// ---------------------------------------------------------------------------

/**
 * Dark theme is the default and is *complete*: every declared token has a value
 * here. Theme-independent tokens (glow, typography, spacing, radius, elevation,
 * motion) are declared once here and are not overridden per theme.
 */
const DARK_TOKENS = {
  // color — surfaces
  'color-bg': '#030712',
  'color-bg-elevated': '#0b1220',
  'color-surface': '#111827',
  'color-surface-2': '#1f2937',
  'color-border': '#1f2937',
  // color — text
  'color-text': '#f3f4f6',
  'color-text-muted': '#cbd5e1',
  // color — accents (1 primary + 3 supporting)
  'color-accent-primary': '#22d3ee',
  'color-accent-2': '#a78bfa',
  'color-accent-3': '#f472b6',
  'color-accent-4': '#fbbf24',
  // color — focus indicator
  'color-focus-ring': '#22d3ee',

  // glow
  'glow-accent': '0 0 20px rgba(34, 211, 238, 0.45)',
  'glow-soft': '0 0 40px rgba(34, 211, 238, 0.22)',

  // typography
  'text-hero': 'clamp(2.5rem, 6vw, 4.5rem)',
  'text-h2': 'clamp(1.75rem, 3vw, 2.5rem)',
  'text-body': '1rem',
  'text-caption': '0.875rem',

  // spacing
  'space-xs': '0.5rem',
  'space-sm': '0.75rem',
  'space-md': '1rem',
  'space-lg': '2rem',
  'space-xl': '4rem',
  'space-section': '6rem',

  // radius
  'radius-card': '1rem',
  'radius-pill': '9999px',

  // elevation
  'shadow-elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
  'shadow-elevation-2': '0 8px 24px 0 rgba(0, 0, 0, 0.45)',
  'shadow-elevation-3': '0 24px 64px 0 rgba(0, 0, 0, 0.55)',

  // motion
  'duration-entrance': '600ms',
  'duration-opacity': '200ms',
  'ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

export type TokenName = keyof typeof DARK_TOKENS

/**
 * Light theme overrides only the theme-dependent color tokens. Every other
 * token falls back to its dark (default) value at resolution time
 * (Requirement 10.4). Accents are darkened so they keep ≥3:1 contrast against
 * light surfaces when used for emphasis / non-text UI.
 */
const LIGHT_OVERRIDES: Partial<Record<TokenName, string>> = {
  'color-bg': '#f8fafc',
  'color-bg-elevated': '#ffffff',
  'color-surface': '#ffffff',
  'color-surface-2': '#f1f5f9',
  'color-border': '#e2e8f0',
  'color-text': '#0f172a',
  'color-text-muted': '#475569',
  'color-accent-primary': '#0e7490',
  'color-accent-2': '#6d28d9',
  'color-accent-3': '#be185d',
  'color-accent-4': '#b45309',
  'color-focus-ring': '#0e7490',
}

// ---------------------------------------------------------------------------
// Declared token registry (name → category) for Property 1 and the 1.1 check
// ---------------------------------------------------------------------------

export interface DesignToken {
  name: TokenName
  category: TokenCategory
}

function categoryOf(name: TokenName): TokenCategory {
  if (name.startsWith('color-')) return 'color'
  if (name.startsWith('glow-')) return 'glow'
  if (name.startsWith('text-')) return 'typography'
  if (name.startsWith('space-')) return 'spacing'
  if (name.startsWith('radius-')) return 'radius'
  if (name.startsWith('shadow-')) return 'elevation'
  // duration-* and ease-* are motion tokens
  return 'motion'
}

export const TOKENS: readonly DesignToken[] = (
  Object.keys(DARK_TOKENS) as TokenName[]
).map((name) => ({ name, category: categoryOf(name) }))

export const TOKEN_NAMES: readonly TokenName[] = TOKENS.map((t) => t.name)

// ---------------------------------------------------------------------------
// Total token resolver (Requirement 10.2, 10.4)
// ---------------------------------------------------------------------------

/**
 * Resolve a token name to its concrete value for the active theme.
 *
 * Total by construction: it never returns an empty/undefined value.
 * - Accepts names with or without a leading `--`.
 * - Accepts semantic accent aliases (e.g. `accent-primary` → `color-accent-primary`).
 * - For the light theme, unscoped tokens fall back to the dark (default) value.
 * - Unknown names fall back to the dark body-text color so a surface is never
 *   left unstyled or transparent.
 */
export function resolveToken(name: string, theme: ThemeMode): string {
  const normalized = name.replace(/^--/, '')
  const candidates = [normalized, `color-${normalized}`] as string[]

  for (const candidate of candidates) {
    if (!(candidate in DARK_TOKENS)) continue
    const key = candidate as TokenName
    if (theme === 'light') {
      const override = LIGHT_OVERRIDES[key]
      if (override) return override
    }
    return DARK_TOKENS[key]
  }

  // ponytail: unknown-name guard. Ceiling — a typo'd token silently resolves to
  // body text instead of throwing. The Property 1 test only feeds declared names
  // and theme-absent names, so this branch is the safety net for stray callers.
  return DARK_TOKENS['color-text']
}

// ---------------------------------------------------------------------------
// WCAG 2.1 contrast (Requirement 2.6, 8.3, 8.4, 10.1) — Property 2 substrate
// ---------------------------------------------------------------------------

interface Rgb {
  r: number
  g: number
  b: number
}

/** Parse a `#rgb`, `#rrggbb`, `rgb(...)`, or `rgba(...)` string into 0–255 channels. */
export function parseColor(color: string): Rgb {
  const value = color.trim()

  if (value.startsWith('#')) {
    let hex = value.slice(1)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
    }
    if (hex.length !== 6) {
      throw new Error(`Unsupported hex color: ${color}`)
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }

  const rgbMatch = value.match(/rgba?\(([^)]+)\)/i)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => parseFloat(p.trim()))
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2] }
    }
  }

  throw new Error(`Unsupported color format: ${color}`)
}

/** WCAG 2.1 relative luminance of a color (0 = black, 1 = white). */
export function relativeLuminance(color: string): number {
  const { r, g, b } = parseColor(color)
  const channel = (raw: number) => {
    const c = raw / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * WCAG 2.1 contrast ratio between two colors. Returns a value in [1, 21].
 * Order-independent.
 */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground)
  const l2 = relativeLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ---------------------------------------------------------------------------
// Theme-scoped text/surface token pairings the contrast util consumes
// ---------------------------------------------------------------------------

/**
 * A contrast obligation: a foreground token rendered over a background token in
 * a given theme, with the minimum WCAG ratio it must meet for its role.
 * - `body`    → 4.5:1 (normal body text)
 * - `large`   → 3:1   (large text ≥18pt / ≥14pt bold)
 * - `non-text`→ 3:1   (meaningful UI / focus indicator)
 */
export type ContrastRole = 'body' | 'large' | 'non-text'

export const MIN_CONTRAST: Record<ContrastRole, number> = {
  body: 4.5,
  large: 3,
  'non-text': 3,
}

export interface ContrastPairing {
  theme: ThemeMode
  role: ContrastRole
  /** foreground token name */
  text: TokenName
  /** background token name */
  surface: TokenName
}

/**
 * The exhaustive set of (theme, text-role, surface) color pairings the
 * Design_System actually relies on. Property 2 asserts every one of these meets
 * its WCAG threshold; keep this list in lock-step with real component usage.
 */
export const CONTRAST_PAIRINGS: readonly ContrastPairing[] = (
  ['dark', 'light'] as const
).flatMap((theme) => [
  // body text over the three surfaces
  { theme, role: 'body', text: 'color-text', surface: 'color-bg' },
  { theme, role: 'body', text: 'color-text', surface: 'color-surface' },
  { theme, role: 'body', text: 'color-text', surface: 'color-surface-2' },
  // muted / caption text over surfaces
  { theme, role: 'body', text: 'color-text-muted', surface: 'color-bg' },
  { theme, role: 'body', text: 'color-text-muted', surface: 'color-surface' },
  // accent used for emphasis / large text / non-text UI
  { theme, role: 'large', text: 'color-accent-primary', surface: 'color-bg' },
  { theme, role: 'non-text', text: 'color-accent-primary', surface: 'color-surface' },
  // focus indicator ring against its backgrounds
  { theme, role: 'non-text', text: 'color-focus-ring', surface: 'color-bg' },
  { theme, role: 'non-text', text: 'color-focus-ring', surface: 'color-surface' },
])
