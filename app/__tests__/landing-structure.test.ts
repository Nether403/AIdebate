// Feature: app-redesign, Task 7.4 — re-pointed landing-structure tests.
//
// The app was redesigned: every route now renders INSIDE the global AppShell
// (the root layout mounts the single sidebar, sticky top bar, and ambient
// background), so a page paints no background and renders no nav of its own
// (Requirement 2.6). The old tests asserted the superseded showcase
// architecture (CtaButton `variant="primary"` strings, a per-page section that
// no longer exists, and a whole-source excluded-term scan that now self-trips on
// the new `Badge` import). They have been re-pointed to the new Landing_Page
// (app/page.tsx) invariants.
//
// The repo has no DOM/RTL harness (node:test + fast-check + static source
// analysis, see tests/run-unit-tests.ts), so these assert against the REAL
// landing source with regex/string checks. What they enforce:
//   - exactly ONE <h1> on the page, and heading levels never skip   (Req 9.2)
//   - the page renders only its own content: it does NOT import or render the
//     retired Navigation / NeuralBackground / ShowcaseShell primitives, paints
//     no page background, and delegates the top bar to the shell via useTopBar
//     (Req 2.6)
//   - >= 4 ordered <section>s, each containing exactly one heading  (structure)
//   - both CTAs are sourced from the Navigation_Manifest CTA_TARGETS, rendered
//     as exactly one primary + one distinct secondary resolving to two real
//     routes                                                        (Req 5.1, 5.3)
//   - the copy keeps the honest workbench framing and contains none of the
//     excluded non-goal terminology                                 (Req 6.x framing)
//
// **Property 3: One h1 per page**
// Validates: Requirements 2.6, 9.2
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CTA_TARGETS, isRealRoute, EXCLUDED_PATTERNS } from '@/lib/design-system/manifest'

// --- Load the real Landing_Page source -------------------------------------
const LANDING_PATH = fileURLToPath(new URL('../page.tsx', import.meta.url))
const RAW_SOURCE = readFileSync(LANDING_PATH, 'utf8')

/**
 * Strip comments so structural scans see only rendered code, never the
 * docstrings — which deliberately enumerate the excluded terms ("no
 * prediction-market, betting, points, badge, social, or gamified language") and
 * mention `<h1>` / `<h2>`, and would otherwise self-trip these scans.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
}

const SOURCE = stripComments(RAW_SOURCE)

/**
 * Extract the page's visible COPY for the framing scans: strip comments, then
 * import statements (so the `@/components/ui/badge` path and the `Badge`
 * identifier never count as copy), then every JSX/HTML tag (so component names
 * like <Badge> / <Button> are removed). What remains is the text the visitor
 * reads plus the string literals in the rendered data arrays (MEASURES,
 * PIPELINE_STAGES, …) — exactly the surface Requirement 6's framing governs.
 */
function landingCopy(src: string): string {
  return stripComments(src)
    .replace(/^\s*import\s[^\n]*$/gm, ' ') // import statements (paths + identifiers)
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ') // JSX / HTML tags (component + element names)
}

const COPY = landingCopy(RAW_SOURCE)

/** Split the source into per-section segments at each `<section` open tag. */
function sectionSegments(src: string): string[] {
  // parts[0] is the preamble before the first <section>; parts[1..] each begin
  // immediately after a <section open tag and run to the next one (sections are
  // not nested on this page), so each segment owns exactly one section's body.
  return src.split(/<section\b/).slice(1)
}

/** Count heading markers (<h1>..<h6>) in a segment. */
function headingCount(segment: string): number {
  const matches = segment.match(/<h[1-6]\b/g)
  return matches ? matches.length : 0
}

/** All heading levels in source order, e.g. [1, 2, 2, 2]. */
function headingLevels(src: string): number[] {
  return [...src.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]))
}

// --- Req 9.2 / Property 3: exactly one <h1> --------------------------------
test('Landing: renders exactly one <h1> (Property 3 — one h1 per page, Req 9.2)', () => {
  const h1s = SOURCE.match(/<h1\b/g) ?? []
  assert.equal(h1s.length, 1, `expected exactly one <h1>, found ${h1s.length}`)
})

// --- Req 9.2: heading levels do not skip -----------------------------------
test('Landing: heading levels start at h1 and never skip a level (Req 9.2)', () => {
  const levels = headingLevels(SOURCE)
  assert.ok(levels.length > 0, 'expected at least one heading on the page')
  assert.equal(levels[0], 1, 'the first heading on the page must be the <h1>')

  // The distinct levels used must form a contiguous run 1..max with no gap
  // (e.g. {1,2} is fine; {1,3} skips h2 and is forbidden).
  const used = [...new Set(levels)].sort((a, b) => a - b)
  used.forEach((level, i) => {
    assert.equal(
      level,
      i + 1,
      `heading levels skip: used ${JSON.stringify(used)} — level ${i + 1} is missing`
    )
  })
})

// --- Req 2.6: the page renders only its own content (no self-rendered shell) -
test('Landing: does not import or render the retired shell/nav/background primitives (Req 2.6)', () => {
  for (const primitive of ['ShowcaseShell', 'Navigation', 'NeuralBackground', 'BackToHub']) {
    assert.ok(
      !new RegExp(`\\b${primitive}\\b`).test(SOURCE),
      `Landing_Page must not reference the retired primitive ${primitive}; the global AppShell owns the shell (Req 2.6)`
    )
  }
  // A full-viewport self-wrapper carried the old page background; the shell owns
  // viewport sizing now, so the page must not declare min-h-screen.
  assert.ok(
    !/\bmin-h-screen\b/.test(SOURCE),
    'Landing_Page must not declare min-h-screen — the AppShell owns the background/viewport (Req 2.6)'
  )
})

test('Landing: delegates the top bar to the shell via useTopBar (Req 2.6)', () => {
  assert.match(
    SOURCE,
    /import\s*\{[^}]*\buseTopBar\b[^}]*\}\s*from\s*['"]@\/components\/layout\/TopBarContext['"]/,
    'Landing_Page must import useTopBar from the shell top-bar context'
  )
  assert.match(SOURCE, /useTopBar\s*\(/, 'Landing_Page must set the top bar via useTopBar(...)')
})

// --- Structure: >= 4 ordered sections, each with exactly one heading --------
test('Landing: has >= 4 sections, each containing exactly one heading', () => {
  const segments = sectionSegments(SOURCE)
  assert.ok(segments.length >= 4, `expected >= 4 <section> elements, found ${segments.length}`)
  segments.forEach((segment, i) => {
    assert.equal(
      headingCount(segment),
      1,
      `section #${i + 1} must contain exactly one heading, found ${headingCount(segment)}`
    )
  })
})

test('Landing: the content-section headings appear in a fixed order', () => {
  // The three content sections beneath the hero, in canonical order.
  const orderedHeadings = ['How it works', 'What it measures', 'Sample artifact']
  let prev = -1
  for (const heading of orderedHeadings) {
    const idx = SOURCE.indexOf(heading)
    assert.ok(idx !== -1, `expected to find section heading "${heading}"`)
    assert.ok(idx > prev, `section heading "${heading}" is out of fixed order`)
    prev = idx
  }
})

// --- Req 5.1 / 5.3: CTAs sourced from the manifest, one primary + one secondary
test('Landing: sources both CTAs from the Navigation_Manifest CTA_TARGETS (Req 5.1)', () => {
  assert.match(
    SOURCE,
    /import\s*\{[^}]*\bCTA_TARGETS\b[^}]*\}\s*from\s*['"]@\/lib\/design-system\/manifest['"]/,
    'Landing_Page must import CTA_TARGETS from the manifest (links are not hard-coded)'
  )
  // The primary/secondary targets are derived from CTA_TARGETS, not literals.
  assert.match(
    SOURCE,
    /CTA_TARGETS\.(find|filter)\(|CTA_TARGETS\[/,
    'Landing_Page must derive its CTAs from CTA_TARGETS'
  )
})

test('Landing: renders exactly one primary and one secondary CTA (Req 5.3)', () => {
  const primaryHrefs = SOURCE.match(/href=\{PRIMARY_CTA\.href\}/g) ?? []
  const secondaryHrefs = SOURCE.match(/href=\{SECONDARY_CTA\.href\}/g) ?? []
  assert.equal(primaryHrefs.length, 1, `expected exactly one primary CTA, found ${primaryHrefs.length}`)
  assert.equal(
    secondaryHrefs.length,
    1,
    `expected exactly one secondary CTA, found ${secondaryHrefs.length}`
  )
  // Both CTA labels are rendered from the manifest entries.
  assert.match(SOURCE, /\{PRIMARY_CTA\.label\}/, 'primary CTA must render PRIMARY_CTA.label')
  assert.match(SOURCE, /\{SECONDARY_CTA\.label\}/, 'secondary CTA must render SECONDARY_CTA.label')
})

test('Landing: the secondary CTA is visually distinct from the primary (Req 5.3)', () => {
  // Primary carries the signature accent gradient (emphasis role); the secondary
  // is the outline variant and carries no gradient fill — so they are not the
  // same emphasis treatment.
  assert.match(
    SOURCE,
    /var\(--accent-gradient\)/,
    'primary CTA must use the accent-gradient emphasis treatment'
  )
  assert.match(
    SOURCE,
    /variant="outline"/,
    'secondary CTA must use the distinct (outline) variant, not the primary emphasis'
  )
})

test('Landing: the manifest primary/secondary CTAs resolve to two distinct real routes (Req 5.3)', () => {
  const primary = CTA_TARGETS.find((c) => c.id === 'primary') ?? CTA_TARGETS[0]
  const secondary = CTA_TARGETS.find((c) => c.id === 'secondary') ?? CTA_TARGETS[1]
  assert.ok(primary && secondary, 'expected a primary and a secondary CTA target in the manifest')
  assert.ok(isRealRoute(primary.href), `primary CTA href must be a real route, got ${primary.href}`)
  assert.ok(isRealRoute(secondary.href), `secondary CTA href must be a real route, got ${secondary.href}`)
  assert.notEqual(
    primary.href,
    secondary.href,
    'the secondary CTA must resolve to a different route than the primary'
  )
})

// --- Req 6.x: honest workbench framing, no excluded terminology -------------
test('Landing: copy uses no prediction/betting/points/badge/social terminology (Req 6.x framing)', () => {
  for (const pattern of EXCLUDED_PATTERNS) {
    const match = COPY.match(pattern)
    assert.equal(
      match,
      null,
      `Landing_Page copy must not match excluded pattern ${pattern}; found "${match?.[0]}"`
    )
  }
})

test('Landing: positively asserts the honest workbench framing (Req 6.x framing)', () => {
  assert.ok(/workbench/i.test(COPY), 'expected "workbench" framing in landing copy')
  assert.ok(/benchmark/i.test(COPY), 'expected "benchmark" framing in landing copy')
})
