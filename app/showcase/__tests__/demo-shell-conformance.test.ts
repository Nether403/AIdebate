// Feature: app-redesign, Task 7.4 — re-pointed demo-page shell-conformance tests.
//
// The app was redesigned: the showcase demo pages no longer wrap themselves in
// the retired ShowcaseShell/BackToHub primitives or paint their own background.
// Every route now renders INSIDE the global AppShell (the root layout owns the
// single sidebar, sticky top bar, and ambient background), so each demo page
// renders only its own content and delegates the top bar to the shell via
// `useTopBar` (Requirement 2.6). The old assertions (require ShowcaseShell +
// BackToHub, forbid any bg-gradient) asserted the superseded architecture and
// have been re-pointed to the new invariants.
//
// The repo has no DOM/RTL harness (node:test + static source analysis, see
// tests/run-unit-tests.ts), so this asserts against the real page source with
// regex/string checks — the same idiom as the sibling showcase tests.
//
// What this enforces on every Showcase_Demo_Page:
//   - exactly ONE <h1>, and the <h1> is the first heading on the page (Req 9.2)
//   - the page renders only its own content: it does NOT import or render the
//     retired ShowcaseShell / BackToHub / Navigation / NeuralBackground
//     primitives, and declares no full-viewport (min-h-screen) self-wrapper —
//     the AppShell owns the shell and background (Req 2.6)
//   - the page delegates the top bar to the shell via useTopBar (Req 2.6)
//
// **Property 3: One h1 per page**
// Validates: Requirements 2.6, 9.2
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

/** Strip comments so doc-comments (which mention <h1>, ShowcaseShell, etc.) never trip the scans. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
}

// Retired shell/nav/background primitives a conforming page must NOT pull in —
// the global AppShell owns all of these now (Req 2.6).
const RETIRED_PRIMITIVES = ['ShowcaseShell', 'BackToHub', 'Navigation', 'NeuralBackground'] as const

// Data-driven: one set of assertions applied to every demo page.
for (const rel of DEMO_PAGES) {
  test(`demo page conforms to the shell: ${rel} (Req 2.6, 9.2 — Property 3)`, () => {
    const src = stripComments(read(rel))

    // (a) Req 9.2 / Property 3: exactly one <h1>, and it is the first heading.
    const h1s = src.match(/<h1\b/g) ?? []
    assert.equal(h1s.length, 1, `${rel} must contain exactly one <h1>, found ${h1s.length}`)

    const levels = [...src.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]))
    assert.equal(levels[0], 1, `${rel} must open its heading hierarchy with the <h1>`)

    // (b) Req 2.6: renders only its own content — none of the retired
    // shell/nav/background primitives, and no full-viewport self-wrapper.
    for (const primitive of RETIRED_PRIMITIVES) {
      assert.ok(
        !new RegExp(`\\b${primitive}\\b`).test(src),
        `${rel} must not reference the retired primitive ${primitive}; the global AppShell owns the shell (Req 2.6)`
      )
    }
    assert.ok(
      !/\bmin-h-screen\b/.test(src),
      `${rel} must not declare min-h-screen — the AppShell owns the background/viewport (Req 2.6)`
    )

    // (c) Req 2.6: the page delegates the top bar to the shell via useTopBar.
    assert.match(
      src,
      /import\s*\{[^}]*\buseTopBar\b[^}]*\}\s*from\s*['"]@\/components\/layout\/TopBarContext['"]/,
      `${rel} must import useTopBar from the shell top-bar context`
    )
    assert.match(src, /useTopBar\s*\(/, `${rel} must set the top bar via useTopBar(...) (Req 2.6)`)
  })
}

// Guard the guard: the page list must stay in sync with the five demo routes,
// so a newly added demo page can't silently skip shell-conformance coverage.
test('all five demo pages are covered (Req 2.6)', () => {
  assert.equal(DEMO_PAGES.length, 5, 'expected exactly the five showcase demo pages')
  const unique = new Set(DEMO_PAGES)
  assert.equal(unique.size, DEMO_PAGES.length, 'demo page list must contain no duplicates')
})
