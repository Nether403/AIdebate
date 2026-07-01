// Feature: app-redesign, Task 12.1 — Property 7: Accent discipline.
//
// Validates: Requirements 1.5, 1.6
//   1.5 "THE Design_System SHALL apply gradient and glow styling only to the
//        interactive and emphasis roles primary button, active navigation item,
//        highlighted KPI, low-severity bar, and legend, and to no other roles."
//   1.6 "WHERE a node renders body text, THE Design_System SHALL render that
//        text without a gradient text-fill or text-shadow."
//
// The repo has no DOM/RTL harness — unit/property tests are node:test +
// fast-check + static source analysis against the REAL page/component sources
// (see app/__tests__/palette-contrast.test.ts, app/showcase/__tests__/
// eval-report-honesty.test.ts, components/app/__tests__/severity-encoding.test.ts).
// This test follows that idiom: it scans the in-scope page + shared-component
// sources for the two accent "tells" and drives a fast-check property over the
// matched occurrences.
//
// The two tells:
//   • Gradient TEXT-FILL = `bg-clip-text` + `text-transparent` (a gradient
//     painted INTO glyphs). Allowed only on emphasis text — a heading or a
//     heading-nested <span> (the landing hero headline). NEVER on body text
//     (<p>/<li>/…), and no text node may carry a text-shadow / shimmer (Req 1.6).
//   • Gradient FILL (background) = `var(--accent-gradient)` or a cyan→violet
//     `bg-gradient-to-*`. Allowed only on an interactive/emphasis/severity role:
//     primary CTA/button, active nav item, highlighted KPI (Stat), low-severity
//     bar (CssBar), or legend (LegendDot) (Req 1.5). Never on body text.
//
// Property 7: Accent discipline.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// --- In-scope source set ----------------------------------------------------
// Per the redesign: every real page (app/**/page.tsx) plus the shared
// presentation components (components/layout/*, components/app/*, and the three
// themed ui primitives). The retired components/showcase/* primitives are out
// of scope (they are deleted in task 11.1) and are deliberately not scanned.
const ROOT = process.cwd()

/** Recursively collect `page.tsx` files beneath `app/`. */
function collectPages(dirRel: string): string[] {
  const out: string[] = []
  for (const ent of readdirSync(join(ROOT, dirRel), { withFileTypes: true })) {
    const rel = `${dirRel}/${ent.name}`
    if (ent.isDirectory()) {
      if (ent.name === '__tests__' || ent.name === 'api') continue // pages only, skip route handlers + tests
      out.push(...collectPages(rel))
    } else if (ent.name === 'page.tsx') {
      out.push(rel)
    }
  }
  return out
}

/** All `.tsx` files directly in a components dir (skip __tests__ + barrels). */
function collectComponents(dirRel: string): string[] {
  return readdirSync(join(ROOT, dirRel), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.tsx'))
    .map((e) => `${dirRel}/${e.name}`)
}

const IN_SCOPE_FILES: readonly string[] = [
  ...collectPages('app'),
  ...collectComponents('components/layout'),
  ...collectComponents('components/app'),
  'components/ui/card.tsx',
  'components/ui/badge.tsx',
  'components/ui/button.tsx',
]

const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8')

/**
 * Strip block comments, JSX `{/* *​/}` comments, and line comments so the scans
 * see only rendered code — never doc-comments. (e.g. Stat.tsx's docstring says
 * "accent-gradient surface + glow"; the AppTopBar style is preceded by a
 * "Gradient identity…" comment — both would otherwise trip the scans.)
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
}

// HTML/JSX tags that render BODY text — accent text-fill and text-shadow are
// forbidden on these (Req 1.6), and gradient fills must never land on them either.
const BODY_TEXT_TAGS = new Set([
  'p', 'li', 'td', 'th', 'dd', 'dt', 'small', 'blockquote', 'figcaption', 'caption',
])
// Tags that may carry an emphasis gradient text-fill (a heading, or a span used
// as heading-nested emphasis — the hero headline pattern).
const EMPHASIS_TEXTFILL_TAGS = new Set(['span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/** The lowercased base name of the nearest JSX element opened before `index`. */
function hostTagOf(src: string, index: number): string {
  let tag = '?'
  for (const m of src.matchAll(/<([A-Za-z][\w.]*)/g)) {
    if (m.index! >= index) break
    tag = m[1]
  }
  // Normalize: lucide/host components stay as-is; HTML tags compare lowercased.
  return /^[a-z]/.test(tag) ? tag.toLowerCase() : tag
}

/** Window of source around an index, for proximity / role-signal checks. */
function windowAround(src: string, index: number, radius = 220): string {
  return src.slice(Math.max(0, index - radius), index + radius)
}

// --- Occurrence model -------------------------------------------------------
type Kind = 'text-fill' | 'fill'
interface Occurrence {
  file: string
  kind: Kind
  index: number
  hostTag: string
  context: string
}

/** A gradient FILL background tell: the accent gradient token or a `bg-gradient-to-*`. */
const FILL_TELL = /var\(--accent-gradient\)|bg-gradient-to-[a-z]+/g

function collectOccurrences(): Occurrence[] {
  const occ: Occurrence[] = []
  for (const file of IN_SCOPE_FILES) {
    const src = stripComments(read(file))

    // (1) Gradient text-fill: every `bg-clip-text` whose same class attr also
    // carries `text-transparent` (a gradient painted into the glyphs).
    for (const m of src.matchAll(/bg-clip-text/g)) {
      const near = src.slice(Math.max(0, m.index! - 90), m.index! + 90)
      if (/text-transparent/.test(near)) {
        occ.push({
          file,
          kind: 'text-fill',
          index: m.index!,
          hostTag: hostTagOf(src, m.index!),
          context: windowAround(src, m.index!),
        })
      }
    }

    // (2) Gradient fill backgrounds.
    for (const m of src.matchAll(FILL_TELL)) {
      occ.push({
        file,
        kind: 'fill',
        index: m.index!,
        hostTag: hostTagOf(src, m.index!),
        context: windowAround(src, m.index!),
      })
    }
  }
  return occ
}

const OCCURRENCES = collectOccurrences()

// Signals that classify a gradient-fill occurrence as one of the five allowed
// interactive/emphasis/severity roles from Req 1.5.
const ALLOWED_ROLE_SIGNALS: ReadonlyArray<{ role: string; pattern: RegExp }> = [
  // primary button / CTA (interactive)
  { role: 'primary button / CTA', pattern: /href=|<Link\b|<button\b|<Button\b|onClick|\baction\b|primaryAction|PRIMARY_CTA/ },
  // active navigation item
  { role: 'active nav item', pattern: /aria-current|\bactive\b|isActive/ },
  // highlighted KPI tile (Stat)
  { role: 'highlighted KPI', pattern: /highlight|data-slot="stat"/ },
  // low-severity comparison bar (CssBar) / legend (LegendDot)
  { role: 'severity bar / legend', pattern: /LegendDot|barClass|role="presentation"|rounded-full|from-cyan-\d+\s+to-violet/ },
  // emphasis headline text (gradient painted into a heading)
  { role: 'emphasis heading', pattern: /bg-clip-text|<h[1-6]\b/ },
]

function allowedRoleFor(context: string): string | null {
  for (const { role, pattern } of ALLOWED_ROLE_SIGNALS) {
    if (pattern.test(context)) return role
  }
  return null
}

// ---------------------------------------------------------------------------
// Property 7a — every gradient TEXT-FILL is on emphasis text, never body text.
// ---------------------------------------------------------------------------
function assertTextFillIsEmphasis(o: Occurrence): void {
  assert.equal(o.kind, 'text-fill')
  assert.ok(
    !BODY_TEXT_TAGS.has(o.hostTag),
    `${o.file}: a gradient text-fill (bg-clip-text + text-transparent) sits on body-text <${o.hostTag}> — forbidden (Req 1.6)`
  )
  assert.ok(
    EMPHASIS_TEXTFILL_TAGS.has(o.hostTag),
    `${o.file}: a gradient text-fill must live on emphasis text (heading or heading-nested span), found host <${o.hostTag}> (Req 1.5)`
  )
  // A <span> emphasis must be heading-nested: a heading opens just before it,
  // with no intervening heading close — i.e. it IS the headline emphasis span.
  if (o.hostTag === 'span') {
    const before = o.context.slice(0, Math.min(o.context.length, 220))
    const headingOpen = before.lastIndexOf('<h1') >= 0 || /<h[1-6]\b/.test(before)
    assert.ok(
      headingOpen && !/<\/h[1-6]>/.test(before.slice(before.search(/<h[1-6]\b/))),
      `${o.file}: a gradient text-fill <span> must be nested inside a heading (hero-headline emphasis), not standalone body text (Req 1.5/1.6)`
    )
  }
}

// ---------------------------------------------------------------------------
// Property 7b — every gradient FILL is on an allowed interactive/emphasis role.
// ---------------------------------------------------------------------------
function assertFillIsAllowedRole(o: Occurrence): void {
  assert.equal(o.kind, 'fill')
  assert.ok(
    !BODY_TEXT_TAGS.has(o.hostTag),
    `${o.file}: a gradient fill sits on body-text <${o.hostTag}> — gradient/glow is reserved for interactive/emphasis roles (Req 1.5)`
  )
  const role = allowedRoleFor(o.context)
  assert.ok(
    role !== null,
    `${o.file}: a gradient fill is not tied to any allowed role ` +
      `(primary button, active nav, highlighted KPI, severity bar, legend, or emphasis heading) — Req 1.5\n` +
      `  context: ${o.context.replace(/\s+/g, ' ').trim().slice(0, 160)}`
  )
}

function assertOccurrence(o: Occurrence): void {
  if (o.kind === 'text-fill') assertTextFillIsEmphasis(o)
  else assertFillIsAllowedRole(o)
}

// ---------------------------------------------------------------------------
// Property 7 (driven over the matched occurrences via fast-check) + exhaustive.
// ---------------------------------------------------------------------------
test('Property 7: every accent occurrence sits on an interactive/emphasis role (Req 1.5, 1.6)', () => {
  assert.ok(OCCURRENCES.length > 0, 'expected to find accent occurrences to validate (scan found none)')

  fc.assert(
    fc.property(fc.constantFrom(...OCCURRENCES), assertOccurrence),
    { numRuns: Math.max(100, OCCURRENCES.length * 4) }
  )

  // The occurrence set is finite; random sampling could skip one, so also
  // assert the invariant exhaustively over every matched occurrence.
  for (const o of OCCURRENCES) assertOccurrence(o)
})

// ---------------------------------------------------------------------------
// Req 1.6 — no body-text node anywhere in scope carries a text-shadow or a
// shimmer text treatment. The redesign removed the shimmer-text primitive, so
// there must be none on the in-scope surfaces. (drop-shadow on text is likewise
// disallowed; drop-shadow on icons/svgs is fine.)
// ---------------------------------------------------------------------------
test('No in-scope surface carries a text-shadow / shimmer text treatment (Req 1.6)', () => {
  const FORBIDDEN: ReadonlyArray<{ label: string; pattern: RegExp }> = [
    { label: 'CSS text-shadow', pattern: /text-shadow/ },
    { label: 'arbitrary [text-shadow:…] utility', pattern: /\[text-shadow:/ },
    { label: 'retired shimmer-text class', pattern: /shimmer-text/ },
  ]
  for (const file of IN_SCOPE_FILES) {
    const src = stripComments(read(file))
    for (const { label, pattern } of FORBIDDEN) {
      assert.ok(
        !pattern.test(src),
        `${file}: body text must carry no ${label} (gradient text-fill/text-shadow is the retired 2000s tell) — Req 1.6`
      )
    }
    // `drop-shadow` is allowed on icons/svgs but not on a body-text element.
    for (const m of src.matchAll(/drop-shadow/g)) {
      const host = hostTagOf(src, m.index!)
      assert.ok(
        !BODY_TEXT_TAGS.has(host),
        `${file}: a drop-shadow lands on body-text <${host}> — no text-shadow on body copy (Req 1.6)`
      )
    }
  }
})

// ---------------------------------------------------------------------------
// Positive coverage: the canonical emphasis gradient text-fill (the landing
// hero headline) is present and IS the emphasis-span role — so 7a is not
// vacuously satisfied by an empty match set.
// ---------------------------------------------------------------------------
test('The landing hero headline carries the one allowed gradient text-fill (Req 1.5)', () => {
  const textFills = OCCURRENCES.filter((o) => o.kind === 'text-fill')
  assert.ok(
    textFills.some((o) => o.file === 'app/page.tsx' && o.hostTag === 'span'),
    'expected the landing hero headline to carry the signature gradient text-fill on its emphasis <span>'
  )
  // Every text-fill (in practice just the hero) is heading/span emphasis.
  for (const o of textFills) assertTextFillIsEmphasis(o)
})

// Guard the guard: the in-scope file set actually resolved to real sources.
test('The accent-discipline scan covers the in-scope page + component sources', () => {
  assert.ok(IN_SCOPE_FILES.includes('app/page.tsx'), 'scan must include the landing page')
  assert.ok(IN_SCOPE_FILES.includes('components/app/Stat.tsx'), 'scan must include the Stat KPI tile')
  assert.ok(IN_SCOPE_FILES.includes('components/app/CssBar.tsx'), 'scan must include CssBar/LegendDot')
  assert.ok(IN_SCOPE_FILES.includes('components/layout/AppTopBar.tsx'), 'scan must include the top bar')
  assert.ok(IN_SCOPE_FILES.length >= 15, `expected a broad in-scope set, found ${IN_SCOPE_FILES.length}`)
})
