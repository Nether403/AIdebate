// Feature: showcase-redesign, Task 10.3 — static / smoke scan checks.
//
// A runnable guard over the Design_System surfaces that FAILS if a future edit
// reintroduces raw styling literals or duplicate primitives. It reads the real
// source files from disk (node:fs) and asserts with regex — there is no DOM /
// browser harness in this repo (node:test + fast-check only, see
// tests/run-unit-tests.ts), so the rendered-layout / area-coverage parts of the
// design's "Static / smoke checks" (e.g. glow/gradient ≤40% of the viewport)
// are covered by the Playwright tasks (10.1) instead and intentionally out of
// scope here.
//
// What this asserts on the redesigned public surfaces (app/page.tsx,
// app/showcase/page.tsx, app/showcase/*/page.tsx, components/showcase/*):
//   1. No raw 6/8-digit hex color literals               (Req 1.2-1.4, 1.6, 10.2)
//   2. No arbitrary px/ms spacing or duration literals
//      in className styling (decorative h/w dims allowed) (Req 1.2-1.4, 3.5)
//   3. glass-panel / glow-blob / shimmer-text defined
//      exactly once across the CSS                        (Req 1.7)
//   4. No glow (text-shadow) applied to body text         (Req 2.5)
//   5. Demo/hub roots render through ShowcaseShell and
//      declare no page background                         (Req 4.4)
//   6. Applied accents/colors reference Design_System
//      tokens only — no raw Tailwind neon palette         (Req 1.6, 2.1, 2.5)
//
// ponytail: two embed-demo chrome components — EmbedNote.tsx (the "how this
// embeds" footer) and HostAppFrame.tsx (a deliberately-foreign fake host-app
// shell, currently unused) — still sit on the raw Tailwind palette (slate /
// emerald / violet / fuchsia) and arbitrary px. They are NOT redesigned
// Design_System surfaces, so they are excluded from the palette/px scans here
// and named explicitly below. Ceiling: tokenizing EmbedNote (a branded surface)
// is a real, separate cleanup; this guard still fails the moment raw palette or
// raw spacing/duration literals reappear on any actual page, shell, or primitive.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8')

// --- in-scope file sets ------------------------------------------------------

// The fixed public page surfaces (Req 1.2-1.4 enumerate them individually).
const PAGE_FILES = [
  'app/page.tsx',
  'app/showcase/page.tsx',
  'app/showcase/live-debate/page.tsx',
  'app/showcase/eval-report/page.tsx',
  'app/showcase/regression-gate/page.tsx',
  'app/showcase/steelman/page.tsx',
  'app/showcase/synthetic-data/page.tsx',
] as const

// The demo pages + hub must render through the shared shell and own no
// background (Req 4.3, 4.4). The landing (app/page.tsx) is bespoke and exempt
// from the shell requirement, so it is not in this list.
const SHELL_ROUTED_FILES = [
  'app/showcase/page.tsx',
  'app/showcase/live-debate/page.tsx',
  'app/showcase/eval-report/page.tsx',
  'app/showcase/regression-gate/page.tsx',
  'app/showcase/steelman/page.tsx',
  'app/showcase/synthetic-data/page.tsx',
] as const

// Embed-demo chrome that is NOT a redesigned Design_System surface (see the
// ponytail note above). Excluded from the palette/px scans only.
const EXCLUDED_CHROME = new Set(['EmbedNote.tsx', 'HostAppFrame.tsx'])

// Every showcase component file, discovered dynamically so new primitives are
// covered automatically without editing this test.
function showcaseComponentFiles(includeChrome: boolean): string[] {
  const dir = 'components/showcase'
  return readdirSync(resolve(ROOT, dir))
    .filter((f) => f.endsWith('.tsx'))
    .filter((f) => includeChrome || !EXCLUDED_CHROME.has(f))
    .map((f) => join(dir, f))
}

// Redesigned surfaces governed by the Design_System token contract.
const tokenGovernedSurfaces = (): string[] => [
  ...PAGE_FILES,
  ...showcaseComponentFiles(false),
]

// Every tsx surface in scope, including the chrome — used only by checks the
// chrome already satisfies (so coverage is maximal where it can be).
const allTsxSurfaces = (): string[] => [...PAGE_FILES, ...showcaseComponentFiles(true)]

// --- Check 1: no raw hex color literals (Req 1.2-1.4, 1.6, 10.2) -------------
//
// 6- or 8-digit hex only, so a PR number like "PR #482" (3 digits) is never a
// false positive. Color values must come from theme-scoped tokens in
// app/globals.css, not be hard-coded on a surface.
test('Task 10.3: no raw hex color literals on any showcase surface (Req 1.2-1.4)', () => {
  const hex = /#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?\b/g
  for (const file of allTsxSurfaces()) {
    const matches = read(file).match(hex)
    assert.equal(
      matches,
      null,
      `${file} contains raw hex color literal(s) ${JSON.stringify(matches)} — use a Design_System token (var(--color-*) or an accent-* utility) instead`
    )
  }
})

// --- Check 2: no arbitrary px/ms spacing or duration literals (Req 1.2-1.4, 3.5)
//
// Spacing, typography size, and motion duration must come from the spacing /
// type / motion token scales — never an arbitrary [12px] / [300ms] literal.
// ponytail: decorative element *dimensions* (h/w/min-/max-/inset/size/basis/
// translate) may use arbitrary px — e.g. the hero GlowBlob `h-[360px] w-[420px]`
// — because those are bespoke decorative sizes, not the spacing rhythm the token
// scale governs. Ceiling: if blob sizing is ever tokenized, drop this allowance.
const DIMENSION_PREFIXES = new Set([
  'h', 'w', 'min-h', 'min-w', 'max-h', 'max-w', 'size', 'basis',
  'top', 'bottom', 'left', 'right', 'inset', 'inset-x', 'inset-y',
  'translate-x', 'translate-y',
])

test('Task 10.3: no arbitrary px/ms spacing or duration literals in className (Req 1.2-1.4, 3.5)', () => {
  // Any arbitrary-value utility: prefix-[value].
  const arbitrary = /([a-z][a-z-]*)-\[([^\]]+)\]/g
  // A raw px/ms literal (not a var(...) / calc(...) token reference).
  const rawPxMs = /^-?[0-9.]+(px|ms)$/

  for (const file of tokenGovernedSurfaces()) {
    const src = read(file)
    const offenders: string[] = []
    for (const m of src.matchAll(arbitrary)) {
      const prefix = m[1]
      const value = m[2]
      if (!rawPxMs.test(value)) continue // var(--*) / calc(...) / non px-ms — fine
      if (value.endsWith('ms')) {
        offenders.push(m[0]) // durations are never allowed as literals
        continue
      }
      if (!DIMENSION_PREFIXES.has(prefix)) offenders.push(m[0]) // spacing/type px
    }
    assert.deepEqual(
      offenders,
      [],
      `${file} uses raw px/ms literal(s) ${JSON.stringify(offenders)} in className — use spacing/type/motion tokens (e.g. [var(--space-md)], [var(--duration-*)])`
    )
  }
})

// --- Check 3: primitives defined exactly once (Req 1.7) ----------------------
//
// Each primitive must have exactly one top-level CSS rule definition. Nested
// reduced-motion overrides inside @media (indented) and the `.glass-panel:hover`
// state are legitimate and are NOT counted — the anchored `^\.name\s*\{` only
// matches a primary, unindented, name-exact rule.
test('Task 10.3: glass-panel / glow-blob / shimmer-text each defined exactly once (Req 1.7)', () => {
  const cssFiles = ['app/globals.css']
  const primitives = ['glass-panel', 'glow-blob', 'shimmer-text'] as const
  for (const name of primitives) {
    const def = new RegExp(`^\\.${name}\\s*\\{`, 'gm')
    let total = 0
    for (const css of cssFiles) {
      total += (read(css).match(def) ?? []).length
    }
    assert.equal(
      total,
      1,
      `primitive .${name} should have exactly ONE top-level definition across the Design_System CSS, found ${total}`
    )
  }
})

// --- Check 4: no glow on body text (Req 2.5) ---------------------------------
//
// Glow/neon is confined to accent/emphasis primitives (glow-blob, shimmer-text).
// Glow applied to text manifests as `text-shadow`; the Design_System CSS uses a
// gradient shimmer for emphasis headings and elevation shadows for surfaces, so
// there is no text-shadow anywhere — reintroducing one (a text glow) fails here.
test('Task 10.3: no glow (text-shadow) applied to body text in the Design_System CSS (Req 2.5)', () => {
  const css = read('app/globals.css')
  const textShadow = css.match(/text-shadow\s*:/g)
  assert.equal(
    textShadow,
    null,
    `app/globals.css declares text-shadow ${JSON.stringify(textShadow)} — glow must stay on accent/emphasis roles, never body text`
  )
})

// --- Check 5: demo/hub roots render through the shell, declare no background (Req 4.4)
//
// Each demo page and the hub must render through ShowcaseShell (which owns the
// single background + min-h-screen) and declare no page background of their own
// — no full-page gradient, no min-h-screen wrapper. Inner card backgrounds
// (bg-surface, bg-accent-primary, …) are token-backed and expected, so they are
// not flagged; only the page-root background-ownership signals are.
test('Task 10.3: demo/hub roots render through ShowcaseShell with no own background (Req 4.4)', () => {
  for (const file of SHELL_ROUTED_FILES) {
    const src = read(file)
    assert.ok(
      /return\s*\(\s*<ShowcaseShell/.test(src),
      `${file} must render through <ShowcaseShell> as its root (so the shell owns the background)`
    )
    assert.ok(
      !src.includes('bg-gradient'),
      `${file} declares a bg-gradient — demo/hub pages must not paint their own background (Req 4.4)`
    )
    assert.ok(
      !src.includes('min-h-screen'),
      `${file} declares min-h-screen — page sizing/background belongs to ShowcaseShell, not the page (Req 4.4)`
    )
  }
})

// --- Check 6: accents/colors reference Design_System tokens only (Req 1.6, 2.5)
//
// The redesign removed the per-page inline neon palette (cyan / violet / pink /
// amber / emerald). Every applied accent must now be a Design_System accent
// token utility (accent-primary / accent-2..4); neutral surfaces use the token
// utilities (bg-surface, text-text, border-border). A raw Tailwind palette
// color utility on a token-governed surface is a regression and fails here.
test('Task 10.3: no raw Tailwind palette color utilities on token-governed surfaces (Req 1.6, 2.5)', () => {
  // (text|bg|border|ring|from|to|via|fill|stroke|outline|decoration|divide|
  //  shadow|accent|caret)-<palette>-<shade>
  const rawPalette =
    /\b(?:text|bg|border|ring|from|to|via|fill|stroke|outline|decoration|divide|shadow|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g

  for (const file of tokenGovernedSurfaces()) {
    const matches = read(file).match(rawPalette)
    assert.equal(
      matches,
      null,
      `${file} uses raw Tailwind palette color utilit(ies) ${JSON.stringify(matches)} — accents/colors must reference Design_System tokens (accent-*, surface, text, border)`
    )
  }
})
