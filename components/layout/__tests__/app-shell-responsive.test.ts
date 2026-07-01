// Feature: app-redesign, Task 2.7 — unit tests for responsive sidebar behavior.
//
// The repo has no DOM/React render harness for unit tests (node:test + fast-check
// only, see tests/run-unit-tests.ts); runtime DOM behavior is covered by Playwright
// e2e. So — matching the sibling static-source idiom of app/__tests__/landing-
// structure.test.ts and app/showcase/__tests__/demo-shell-conformance.test.ts —
// these assert the responsive-disclosure invariants of Requirement 10 against the
// REAL App_Shell source (components/layout/AppShell.tsx):
//
//   - 10.1/10.2  the sidebar-disclosure toggle is `lg:hidden` (rendered below the
//                1024px breakpoint, absent at/above it) and the persistent sidebar
//                column is `hidden lg:block`. jsdom can't evaluate media queries,
//                so the breakpoint behavior is asserted via the responsive Tailwind
//                class — the literal source of that visibility.
//   - 10.5       activating the toggle opens the drawer (`setOpen(true)`, drawer
//                rendered only while `open`) and moves focus INTO the drawer panel
//                (`panelRef.current?.focus()` on open).
//   - 10.6       every dismiss path (Escape, overlay click, close button, nav-link
//                follow) closes the drawer, focus RETURNS to the toggle
//                (`toggleRef.current?.focus()` on close), and focus is NOT trapped.
//
// Validates: Requirements 10.1, 10.2, 10.5, 10.6
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// --- Load the real App_Shell source ----------------------------------------
const SHELL_PATH = fileURLToPath(new URL('../AppShell.tsx', import.meta.url))
const RAW_SOURCE = readFileSync(SHELL_PATH, 'utf8')

/**
 * Strip comments so the scans see only rendered code, never the docstrings —
 * which narrate the focus contract ("moves focus into it", "returns focus to the
 * toggle", "Focus is moved in but NOT trapped") and the "No focus trap" note, and
 * would otherwise self-satisfy or self-trip the assertions below. Block comments
 * first (covers docstring + JSX comment forms), then line comments.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

const SOURCE = stripComments(RAW_SOURCE)

/** Isolate the disclosure <button …aria-label="Open navigation" …> element body. */
function toggleElement(src: string): string {
  const start = src.indexOf('aria-label="Open navigation"')
  assert.ok(start !== -1, 'expected a disclosure toggle with aria-label="Open navigation"')
  // The toggle is a <button>; capture from its opening up to the end of its
  // className/attribute list (the closing `/>`-less `>` of the open tag region,
  // here the `)` that ends the toggle JSX expression assigned to `toggle`).
  const region = src.slice(start, src.indexOf('<Menu', start))
  assert.ok(region.length > 0, 'could not isolate the toggle element region')
  return region
}

// --- 10.1 / 10.2: breakpoint visibility via responsive classes --------------
test('App_Shell: disclosure toggle is lg:hidden — present below 1024px, absent at/above (Req 10.1, 10.2)', () => {
  const toggle = toggleElement(SOURCE)
  assert.match(
    toggle,
    /\blg:hidden\b/,
    'the sidebar-disclosure toggle must carry `lg:hidden` so it is hidden at/above the 1024px breakpoint'
  )
})

test('App_Shell: persistent sidebar column is `hidden lg:block` — off-canvas below 1024px (Req 10.1, 10.2)', () => {
  // The persistent column wraps <AppSidebar/> and must be hidden below lg and
  // shown at/above it.
  assert.match(
    SOURCE,
    /className="hidden lg:block"\s*>\s*<AppSidebar\b/,
    'the persistent sidebar column must be `hidden lg:block` (off-canvas below 1024px, persistent at/above)'
  )
})

test('App_Shell: the off-canvas drawer is itself lg:hidden (Req 10.1, 10.2)', () => {
  // The drawer overlay (rendered only while open) is mobile-only; at/above lg the
  // persistent column is used instead, so the drawer must not appear.
  assert.match(
    SOURCE,
    /\{open && \(\s*<div className="fixed inset-0 z-40 lg:hidden">/,
    'the off-canvas drawer must be rendered only while open and be `lg:hidden`'
  )
})

// --- 10.5: activating the toggle opens the drawer and moves focus in --------
test('App_Shell: the toggle opens the drawer on activation (Req 10.5)', () => {
  const toggle = toggleElement(SOURCE)
  assert.match(
    toggle,
    /onClick=\{\(\) => setOpen\(true\)\}/,
    'activating the toggle must open the drawer (setOpen(true))'
  )
  // The toggle declares the drawer it controls and its expanded state for AT.
  assert.match(toggle, /aria-controls="app-sidebar-drawer"/, 'toggle must reference the drawer via aria-controls')
  assert.match(toggle, /aria-expanded=\{open\}/, 'toggle must reflect open state via aria-expanded')
})

test('App_Shell: the drawer is a focusable dialog rendered only while open (Req 10.5)', () => {
  // Drawer panel exists only when `open`, is the element identified by the
  // toggle's aria-controls, and is programmatically focusable (tabIndex -1).
  assert.match(SOURCE, /id="app-sidebar-drawer"/, 'drawer panel must carry id="app-sidebar-drawer"')
  assert.match(SOURCE, /ref=\{panelRef\}/, 'drawer panel must hold the panelRef')
  assert.match(SOURCE, /role="dialog"/, 'drawer panel must be role="dialog"')
  assert.match(SOURCE, /tabIndex=\{-1\}/, 'drawer panel must be programmatically focusable (tabIndex={-1})')
})

test('App_Shell: opening moves focus INTO the drawer panel (Req 10.5)', () => {
  // The open branch of the focus effect must focus the panel.
  assert.match(
    SOURCE,
    /if \(open\) \{\s*panelRef\.current\?\.focus\(\)/,
    'on open, focus must move into the drawer panel (panelRef.current?.focus())'
  )
})

// --- 10.6: dismissing closes the drawer and returns focus to the toggle -----
test('App_Shell: closing returns focus to the toggle (Req 10.6)', () => {
  // The close branch (was open, now closed) must restore focus to the toggle.
  assert.match(
    SOURCE,
    /else if \(wasOpen\.current\) \{\s*toggleRef\.current\?\.focus\(\)/,
    'on close, focus must return to the disclosure toggle (toggleRef.current?.focus())'
  )
})

test('App_Shell: all four dismiss paths close the drawer (Req 10.6)', () => {
  // (a) Escape key.
  assert.match(
    SOURCE,
    /e\.key === 'Escape'\) setOpen\(false\)/,
    'Escape must dismiss the open drawer'
  )
  // (b) Overlay (scrim) click.
  assert.match(
    SOURCE,
    /bg-black\/60[\s\S]*?onClick=\{\(\) => setOpen\(false\)\}/,
    'clicking the overlay must dismiss the drawer'
  )
  // (c) Explicit close button.
  const closeIdx = SOURCE.indexOf('aria-label="Close navigation"')
  assert.ok(closeIdx !== -1, 'a close button with aria-label="Close navigation" must exist')
  assert.match(
    SOURCE.slice(closeIdx, closeIdx + 120),
    /onClick=\{\(\) => setOpen\(false\)\}/,
    'the close button must dismiss the drawer'
  )
  // (d) Following a nav link inside the drawer.
  assert.match(
    SOURCE,
    /closest\('a'\)\) setOpen\(false\)/,
    'following a nav link inside the drawer must dismiss it'
  )
})

test('App_Shell: focus is moved in but NOT trapped (Req 10.6 / 9.6)', () => {
  // A non-trapping disclosure: the dialog is explicitly non-modal and there is
  // no Tab-cycling / focus-trap machinery keeping focus inside the drawer.
  assert.match(SOURCE, /aria-modal="false"/, 'drawer must be non-modal (aria-modal="false")')
  assert.doesNotMatch(SOURCE, /aria-modal="true"/, 'drawer must not be a modal focus trap')
  assert.doesNotMatch(SOURCE, /focus-trap|focusTrap|createFocusTrap/, 'must not use a focus-trap utility')
  assert.doesNotMatch(SOURCE, /e\.key === 'Tab'/, 'must not intercept Tab to cycle/trap focus')
})
