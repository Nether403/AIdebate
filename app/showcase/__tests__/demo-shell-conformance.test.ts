// Feature: showcase-redesign, Task 9.6 — example test for demo-page shell conformance.
//
// Every Showcase_Demo_Page must render through the shared ShowcaseShell, declare
// NO page background of its own (the shell owns the background), and show a
// BackToHub return link. The repo has no DOM/RTL harness (node:test + fast-check
// only, see tests/run-unit-tests.ts), so this asserts the invariants against the
// real page source — the same static-source idiom as the sibling showcase tests.
//
// Validates: Requirements 4.2, 4.3, 4.4
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The five demo pages under app/showcase/*, relative to the repo root (the cwd
// `npm run test:unit` runs from).
const DEMO_PAGES = [
  'app/showcase/live-debate/page.tsx',
  'app/showcase/eval-report/page.tsx',
  'app/showcase/regression-gate/page.tsx',
  'app/showcase/steelman/page.tsx',
  'app/showcase/synthetic-data/page.tsx',
] as const

const read = (rel: string): string => readFileSync(join(process.cwd(), rel), 'utf8')

// Background utilities that would override or conflict with the shared shell
// background (Req 4.4). Inner panels legitimately use token-scoped fills
// (bg-surface, bg-accent-primary, bg-transparent, …) — those are NOT page
// backgrounds and must not be flagged, so we match only the concrete
// own-background anti-patterns the old per-page implementations used:
//   - bg-gradient-*  (gradient backdrops)
//   - bg-slate-*     (raw slate palette)
//   - bg-[...]       (arbitrary-value background)
//   - min-h-screen   (full-viewport self-wrapper that carried a background)
const FORBIDDEN_BACKGROUND: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: 'bg-gradient-*', pattern: /\bbg-gradient/ },
  { label: 'bg-slate-*', pattern: /\bbg-slate/ },
  { label: 'arbitrary bg-[…]', pattern: /\bbg-\[/ },
  { label: 'min-h-screen wrapper', pattern: /\bmin-h-screen\b/ },
]

// Data-driven: one set of assertions applied to every demo page.
for (const rel of DEMO_PAGES) {
  test(`demo page conforms to the shared shell: ${rel} (Req 4.2, 4.3, 4.4)`, () => {
    const src = read(rel)

    // (a) Renders THROUGH ShowcaseShell: imported, used, and the root element
    // the component returns (Req 4.3).
    assert.match(
      src,
      /import\s*\{[^}]*\bShowcaseShell\b[^}]*\}\s*from\s*['"]@\/components\/showcase\/ShowcaseShell['"]/,
      `${rel} must import ShowcaseShell`
    )
    assert.match(src, /<ShowcaseShell\b/, `${rel} must render <ShowcaseShell>`)
    assert.match(
      src,
      /return\s*\(?\s*<ShowcaseShell\b/,
      `${rel} must render through ShowcaseShell as its root element`
    )

    // (b) Shows a BackToHub return link to the hub (Req 4.2).
    assert.match(
      src,
      /import\s*\{[^}]*\bBackToHub\b[^}]*\}\s*from\s*['"]@\/components\/showcase\/BackToHub['"]/,
      `${rel} must import BackToHub`
    )
    assert.match(src, /<BackToHub\b/, `${rel} must render a <BackToHub> return link`)

    // (c) Declares NO own background (Req 4.4).
    for (const { label, pattern } of FORBIDDEN_BACKGROUND) {
      assert.ok(
        !pattern.test(src),
        `${rel} must not declare its own background (found "${label}"); the shared ShowcaseShell owns the background`
      )
    }
  })
}

// Guard the guard: the page list must stay in sync with the five demo routes,
// so a newly added demo page can't silently skip shell-conformance coverage.
test('all five demo pages are covered (Req 4.3)', () => {
  assert.equal(DEMO_PAGES.length, 5, 'expected exactly the five showcase demo pages')
  const unique = new Set(DEMO_PAGES)
  assert.equal(unique.size, DEMO_PAGES.length, 'demo page list must contain no duplicates')
})
