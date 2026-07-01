// Feature: app-redesign, Task 12.3 — Property 6: No decorative layout shift.
//
// Validates: Requirements 11.2, 11.6 (and, by construction, the AmbientGlow's
// 0 contribution to the page-level CLS budgets of 11.1/11.3/10.3 that the
// sibling Playwright e2e suites measure at runtime).
//
//   11.2 THE Ambient_Glow SHALL render as a fixed, out-of-flow,
//        pointer-events-none layer that contributes a cumulative layout shift
//        of 0.
//   11.6 THE Application SHALL render the global background decoration as a
//        static layer with no per-frame animation loop and no per-frame repaint
//        after initial paint.
//
// WHY A STATIC-SOURCE PROPERTY (and not only an E2E CLS measurement):
// "contributes 0 to CLS" is a structural guarantee, not a timing accident. An
// element that is `position: fixed` + `inset-0` is removed from normal flow and
// pinned to the viewport, so it can neither be displaced nor displace adjacent
// content; `pointer-events-none` + `aria-hidden` keep it inert and out of the
// a11y tree; and the absence of any per-frame loop (rAF / interval / canvas /
// reveal effect) means it never repaints to trigger a late shift. Proving those
// properties against the REAL source is deterministic and always runs in the
// unit suite, whereas a runtime CLS read is a (valuable but) noisier confirmation
// that lives in the Playwright performance spec. This file is the robust core;
// the e2e spec is the empirical backstop.
//
// This repo has no DOM/RTL harness — the unit suite is node:test + fast-check
// over the real source files (see app/__tests__/accent-discipline.test.ts and
// app/__tests__/reduced-motion.test.ts, which parse globals.css / page sources).
// This test follows that idiom exactly.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8')

const AMBIENT = read('components/layout/AmbientGlow.tsx')

/**
 * Isolate the root layer element of AmbientGlow — the outermost `<div …>` open
 * tag (up to its first `>`). The out-of-flow / inert / z-order guarantees of
 * Req 11.2 are properties of THIS element, so we assert against its class +
 * attribute list rather than the whole file (a nested blob carrying `absolute`
 * must not satisfy a `fixed` check meant for the root).
 */
function rootLayerOpenTag(src: string): string {
  const open = src.indexOf('<div')
  assert.ok(open >= 0, 'AmbientGlow must render a root <div> layer')
  const close = src.indexOf('>', open)
  assert.ok(close > open, 'AmbientGlow root <div> must have a closing `>`')
  return src.slice(open, close + 1)
}

const ROOT_LAYER = rootLayerOpenTag(AMBIENT)

// --- Property 6 (A): the layer is fixed, out-of-flow, inert decoration ------
//
// Each token is an independent necessary condition for "contributes 0 to CLS".
// Driving them through fast-check (over the finite, exhaustively-sampled token
// set) keeps the property framing while reading the same as a table assertion.
interface LayerToken {
  token: string
  /** Matches the token on the ROOT layer open tag. */
  pattern: RegExp
  why: string
}

const REQUIRED_LAYER_TOKENS: readonly LayerToken[] = [
  {
    token: 'fixed',
    pattern: /\bfixed\b/,
    why: 'position:fixed pins the layer to the viewport — removed from normal flow, so it cannot shift or be shifted (Req 11.2)',
  },
  {
    token: 'inset-0',
    pattern: /\binset-0\b/,
    why: 'inset-0 sizes the layer to the viewport box without participating in content flow (Req 11.2)',
  },
  {
    token: 'z-0',
    pattern: /\bz-0\b/,
    why: 'z-0 keeps the decoration behind the z-10 content column (layered visual model, Req 11.2)',
  },
  {
    token: 'pointer-events-none',
    pattern: /\bpointer-events-none\b/,
    why: 'pointer-events-none keeps the layer inert so it never intercepts interaction (Req 11.2)',
  },
  {
    token: 'aria-hidden',
    pattern: /\baria-hidden\b/,
    why: 'aria-hidden removes the purely decorative layer from the accessibility tree (Req 11.2)',
  },
]

test('Property 6 (A): AmbientGlow root is a fixed, out-of-flow, inert decoration layer (Req 11.2)', () => {
  fc.assert(
    fc.property(fc.constantFrom(...REQUIRED_LAYER_TOKENS), (t) => {
      assert.ok(
        t.pattern.test(ROOT_LAYER),
        `AmbientGlow root layer must carry \`${t.token}\` — ${t.why}\n  root tag: ${ROOT_LAYER}`
      )
    }),
    { numRuns: Math.max(50, REQUIRED_LAYER_TOKENS.length * 5) }
  )
  // Finite set — assert exhaustively so no token is skipped by sampling.
  for (const t of REQUIRED_LAYER_TOKENS) {
    assert.ok(t.pattern.test(ROOT_LAYER), `missing required layer token \`${t.token}\``)
  }
})

// --- Property 6 (B): the layer is STATIC — no per-frame loop / repaint -------
//
// Req 11.6: no per-frame animation loop and no per-frame repaint after initial
// paint. A static decoration cannot produce a late layout shift. We forbid every
// mechanism that would make the layer animate or re-render per frame.
const STATIC_VIOLATIONS: readonly { label: string; pattern: RegExp }[] = [
  { label: "client interactivity ('use client')", pattern: /['"]use client['"]/ },
  { label: 'requestAnimationFrame loop', pattern: /requestAnimationFrame/ },
  { label: 'setInterval timer', pattern: /\bsetInterval\b/ },
  { label: 'setTimeout timer', pattern: /\bsetTimeout\b/ },
  { label: 'useEffect side-effect', pattern: /\buseEffect\b/ },
  { label: 'useState re-render driver', pattern: /\buseState\b/ },
  { label: '<canvas> per-frame surface', pattern: /<canvas\b/i },
  { label: 'Tailwind animate-* utility', pattern: /\banimate-[a-z]/ },
  { label: 'CSS animation declaration', pattern: /\banimation\s*:/ },
]

test('Property 6 (B): AmbientGlow is a static layer with no per-frame loop or repaint (Req 11.6)', () => {
  for (const { label, pattern } of STATIC_VIOLATIONS) {
    assert.ok(
      !pattern.test(AMBIENT),
      `AmbientGlow must be a static layer — found ${label}, which would repaint/animate per frame and could trigger a late layout shift (Req 11.6)`
    )
  }
})

// --- Property 6 (C): AppShell is the single mount point, mounted exactly once
//
// Design "layered visual model": the global background decoration is mounted by
// AppShell and ONLY by AppShell, exactly once. Two glows (or a glow mounted by a
// page) would reintroduce the per-screen background drift the redesign removed
// and break the single-decoration invariant behind Req 11.2.
test('Property 6 (C): AmbientGlow is mounted exactly once, only by AppShell', () => {
  const shell = read('components/layout/AppShell.tsx')
  const mountsInShell = (shell.match(/<AmbientGlow\b/g) ?? []).length
  assert.equal(
    mountsInShell,
    1,
    `AppShell must mount exactly one <AmbientGlow/> (found ${mountsInShell})`
  )

  // No in-scope page mounts its own AmbientGlow (the pages render content only;
  // the shell owns the decoration). Scan every real page source.
  const PAGES = [
    'app/page.tsx',
    'app/showcase/page.tsx',
    'app/showcase/eval-report/page.tsx',
    'app/showcase/live-debate/page.tsx',
    'app/showcase/regression-gate/page.tsx',
    'app/showcase/steelman/page.tsx',
    'app/showcase/synthetic-data/page.tsx',
    'app/health/page.tsx',
    'app/debate/new/page.tsx',
    'app/debate/example/page.tsx',
  ] as const
  for (const page of PAGES) {
    assert.ok(
      !/<AmbientGlow\b/.test(read(page)),
      `${page} must not mount its own AmbientGlow — the shell is the single mount point (Req 11.2)`
    )
  }
})
