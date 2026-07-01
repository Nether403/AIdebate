// Feature: app-redesign, Task 6.3 — unit test for honesty badges on the
// eval-report screen (Property 5: Honesty labels present).
//
// The repo has no DOM/RTL harness (node:test + static source analysis only,
// see tests/run-unit-tests.ts and the sibling demo-shell-conformance test), so
// this asserts the invariants against the REAL page source
// (app/showcase/eval-report/page.tsx) using the same static-source idiom.
//
// It verifies that:
//   - a "Sample / demo data" badge renders on the KPI stat row (Req 13.4, 7.1)
//   - a "Sample / demo data" badge renders on the scorecard table (Req 13.4, 7.1)
//   - a "Model-based signal · not ground truth" badge renders on the
//     judge-derived surface (Req 7.2)
//   - all three honesty surfaces carry their labels together, and the labels are
//     rendered statically — not gated behind a hover/click/expand interaction,
//     so they are visible without interaction (Req 7.1, 7.2, 7.3)
//
// Validates: Requirements 7.1, 7.2, 7.3, 13.4
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Relative to the repo root (the cwd both `npm run test:unit` and a standalone
// `npx tsx --test` run from).
const EVAL_REPORT = 'app/showcase/eval-report/page.tsx'
const RAW_SOURCE = readFileSync(join(process.cwd(), EVAL_REPORT), 'utf8')

/**
 * Strip comments so the badge/structure scans see only rendered code, never the
 * docstring — which mentions "ILLUSTRATIVE SAMPLE DATA" and "the visual ground
 * truth for the redesign" and would otherwise muddy the surface checks. Block
 * comments first (docstring + JSX-comment forms), then line comments.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

const SOURCE = stripComments(RAW_SOURCE)

// The exact honesty-label badges the canonical screen renders.
const SAMPLE_BADGE = /<Badge\s+tone="neutral">\s*Sample \/ demo data\s*<\/Badge>/g
const SIGNAL_BADGE =
  /<Badge\s+tone="accent">\s*Model-based signal · not ground truth\s*<\/Badge>/

// --- 13.4 / 7.1: "sample / demo data" on the KPI stat row ------------------
test('Eval report: a "Sample / demo data" badge renders on the KPI stat row (Req 13.4, 7.1)', () => {
  // The KPI-row badge sits between the page heading (</h1>) and the first <Stat>
  // tile of the KPI grid, so it labels the KPI row specifically.
  const h1End = SOURCE.indexOf('</h1>')
  const firstStat = SOURCE.indexOf('<Stat')
  assert.ok(h1End !== -1, 'expected a single <h1> heading on the page')
  assert.ok(firstStat !== -1, 'expected the KPI grid to render <Stat> tiles')
  assert.ok(firstStat > h1End, 'expected the KPI grid to follow the heading')

  const kpiRegion = SOURCE.slice(h1End, firstStat)
  assert.match(
    kpiRegion,
    /<Badge\s+tone="neutral">\s*Sample \/ demo data\s*<\/Badge>/,
    'expected a "Sample / demo data" badge on the KPI stat row (between the heading and the first <Stat>)'
  )
})

// --- 13.4 / 7.1: "sample / demo data" on the scorecard table ---------------
test('Eval report: a "Sample / demo data" badge renders on the scorecard table (Req 13.4, 7.1)', () => {
  // The scorecard table is headed by `title="Per-model scorecard"`; its badge is
  // rendered immediately above that header, inside the same Card.
  const tableHeaderIdx = SOURCE.indexOf('Per-model scorecard')
  const tableTagIdx = SOURCE.indexOf('<Table')
  assert.ok(tableHeaderIdx !== -1, 'expected the "Per-model scorecard" table header')
  assert.ok(tableTagIdx !== -1, 'expected the page to render a <Table>')

  // Window covering the table Card head (badge + CardHeader) but not the
  // preceding win-rate section, which carries no sample badge.
  const tableRegion = SOURCE.slice(Math.max(0, tableHeaderIdx - 320), tableHeaderIdx)
  assert.match(
    tableRegion,
    /<Badge\s+tone="neutral">\s*Sample \/ demo data\s*<\/Badge>/,
    'expected a "Sample / demo data" badge on the scorecard table (just above the "Per-model scorecard" header)'
  )
})

// --- 7.2: "model-based signal · not ground truth" on judge output ----------
test('Eval report: a "Model-based signal · not ground truth" badge renders on the judge-output surface (Req 7.2)', () => {
  // The whole scorecard (win rate, factuality, charismatic-liar) is derived from
  // judge output under a fixed judge config, so the judge-signal badge labels it.
  assert.match(
    SOURCE,
    SIGNAL_BADGE,
    'expected a "Model-based signal · not ground truth" accent badge on the judge-derived surface'
  )
})

// --- 7.3: both labels co-present + at least the two named surfaces ---------
test('Eval report: renders both honesty labels, with sample badges on >= 2 surfaces (Req 7.3, 13.4)', () => {
  const sampleBadges = SOURCE.match(SAMPLE_BADGE) ?? []
  // Heading + KPI row + scorecard table — at least the two task-named surfaces.
  assert.ok(
    sampleBadges.length >= 2,
    `expected the "Sample / demo data" badge on >= 2 surfaces, found ${sampleBadges.length}`
  )
  assert.match(SOURCE, SIGNAL_BADGE, 'expected the judge-signal badge to co-exist with the sample badges')
})

// --- 7.1 / 7.2: labels visible WITHOUT interaction -------------------------
test('Eval report: honesty badges are rendered statically, not behind a hover/click/expand guard (Req 7.1, 7.2)', () => {
  // Pragmatic static guarantee for this presentation-only page: it carries no
  // interaction handlers or visibility-gating utilities, so the honesty badges
  // cannot sit behind a hover, click, or expand interaction. If a future edit
  // hides a badge behind such a guard, this trips.
  const INTERACTION_GUARDS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
    { label: 'onClick handler', pattern: /\bonClick\b/ },
    { label: 'onMouseEnter handler', pattern: /\bonMouseEnter\b/ },
    { label: 'useState toggle', pattern: /\buseState\b/ },
    { label: 'aria-expanded toggle', pattern: /\baria-expanded\b/ },
    { label: 'hidden class', pattern: /className="[^"]*\bhidden\b/ },
    { label: 'group-hover gate', pattern: /\bgroup-hover:/ },
    { label: 'peer- visibility gate', pattern: /\bpeer-/ },
  ]
  for (const { label, pattern } of INTERACTION_GUARDS) {
    assert.ok(
      !pattern.test(SOURCE),
      `eval-report honesty badges must be visible without interaction; found an interaction/visibility guard ("${label}")`
    )
  }
})
