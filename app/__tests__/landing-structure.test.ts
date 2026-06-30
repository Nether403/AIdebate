// Feature: showcase-redesign, Task 7.4 — example tests for landing structure.
//
// The repo has no DOM/React render harness (node:test + fast-check only, see
// tests/run-unit-tests.ts), so these are static-source-analysis examples over
// the REAL Landing_Page source (app/page.tsx) plus the typed CtaButton variant
// contract. They assert the structural invariants of Requirement 3:
//   - >= 4 distinct, ordered sections, each containing exactly one heading (3.2)
//   - exactly one primary call-to-action on the page (3.3)
//   - every secondary CTA is visually distinct from the primary (3.4)
//   - the copy uses honest workbench framing with no excluded terminology —
//     no prediction-market / betting / points / badge / social-sharing
//     language (3.6)
//
// Validates: Requirements 3.2, 3.3, 3.4, 3.6
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CTA_VARIANT_CLASSES } from '@/components/showcase/CtaButton'
import { EXCLUDED_PATTERNS } from '@/lib/design-system/manifest'

// --- Load the real Landing_Page source -------------------------------------
const LANDING_PATH = fileURLToPath(new URL('../page.tsx', import.meta.url))
const RAW_SOURCE = readFileSync(LANDING_PATH, 'utf8')

/**
 * Strip comments so structural/copy scans see only rendered code, never the
 * docstrings — which deliberately enumerate the excluded terms ("no
 * prediction-market, betting, points, badge, or social-sharing language") and
 * would otherwise self-trip the Requirement 3.6 scan. Block comments first
 * (covers both docstring and JSX comment forms), then line comments.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

const SOURCE = stripComments(RAW_SOURCE)

/** Split the source into per-section segments at each `<section` open tag. */
function sectionSegments(src: string): string[] {
  // parts[0] is the preamble before the first <section>; parts[1..] each begin
  // immediately after a <section open tag and run to the next one (sections are
  // not nested on this page), so each segment owns exactly one section's body.
  return src.split(/<section\b/).slice(1)
}

/** Count heading markers (one HTML <h1>..<h6> OR one <SectionHeading>). */
function headingCount(segment: string): number {
  const matches = segment.match(/<SectionHeading\b|<h[1-6]\b/g)
  return matches ? matches.length : 0
}

// --- 3.2: >= 4 ordered sections, each with exactly one heading -------------
test('Landing: has >= 4 sections, each containing exactly one heading (Req 3.2)', () => {
  const segments = sectionSegments(SOURCE)

  assert.ok(
    segments.length >= 4,
    `expected >= 4 <section> elements, found ${segments.length}`
  )

  segments.forEach((segment, i) => {
    assert.equal(
      headingCount(segment),
      1,
      `section #${i + 1} must contain exactly one heading, found ${headingCount(segment)}`
    )
  })
})

test('Landing: exactly one top-level <h1> across the page (Req 3.2 / 8.5)', () => {
  const h1s = SOURCE.match(/<h1\b/g) ?? []
  assert.equal(h1s.length, 1, `expected exactly one <h1>, found ${h1s.length}`)
})

test('Landing: the four content-section headings appear in a fixed order (Req 3.2)', () => {
  // Requirement 3.2 demands a fixed section order. These are the four content
  // sections' headings in their canonical order; assert their source positions
  // strictly increase.
  const orderedHeadings = [
    'How it works',
    'What it measures',
    'Sample artifact',
    'Run your first benchmark',
  ]

  let prev = -1
  for (const heading of orderedHeadings) {
    const idx = SOURCE.indexOf(heading)
    assert.ok(idx !== -1, `expected to find section heading "${heading}"`)
    assert.ok(
      idx > prev,
      `section heading "${heading}" is out of fixed order`
    )
    prev = idx
  }
})

// --- 3.3: exactly one primary CTA ------------------------------------------
test('Landing: defines exactly one primary call-to-action (Req 3.3)', () => {
  const primaries = SOURCE.match(/variant="primary"/g) ?? []
  assert.equal(
    primaries.length,
    1,
    `expected exactly one primary CTA, found ${primaries.length}`
  )
})

// --- 3.4: secondary CTAs are visually distinct from the primary ------------
test('Landing: secondary CTAs are present and visually distinct from primary (Req 3.4)', () => {
  const secondaries = SOURCE.match(/variant="secondary"/g) ?? []
  assert.ok(secondaries.length >= 1, 'expected at least one secondary CTA on the page')

  // Distinctness is enforced by the shared CtaButton variant contract: the
  // secondary variant must reuse none of the primary's three emphasis axes —
  // fill (bg-accent-primary), size (text-body), weight (font-bold).
  const tokens = (classes: string) => new Set(classes.split(/\s+/).filter(Boolean))
  const primary = tokens(CTA_VARIANT_CLASSES.primary)
  const secondary = tokens(CTA_VARIANT_CLASSES.secondary)

  for (const emphasis of ['bg-accent-primary', 'text-body', 'font-bold']) {
    assert.ok(primary.has(emphasis), `primary CTA should define emphasis token ${emphasis}`)
    assert.ok(
      !secondary.has(emphasis),
      `secondary CTA must not reuse the primary emphasis token ${emphasis}`
    )
  }
})

// --- 3.6: workbench framing, no excluded terminology -----------------------
test('Landing: copy uses no prediction/betting/points/badge/social terminology (Req 3.6)', () => {
  for (const pattern of EXCLUDED_PATTERNS) {
    const match = SOURCE.match(pattern)
    assert.equal(
      match,
      null,
      `Landing_Page copy must not match excluded pattern ${pattern}; found "${match?.[0]}"`
    )
  }
})

test('Landing: positively asserts the honest workbench framing (Req 3.6)', () => {
  // The page must describe itself as an LLM debate benchmarking / alignment
  // research workbench (the honest framing the excluded terms would replace).
  assert.ok(/workbench/i.test(SOURCE), 'expected "workbench" framing in landing copy')
  assert.ok(
    /benchmark/i.test(SOURCE),
    'expected "benchmark" framing in landing copy'
  )
})
