// Feature: app-redesign, Task 3.2 — unit tests for theme default and
// invalid-preference overwrite.
//
// The repo has no DOM/React render harness (node:test + fast-check only, see
// tests/run-unit-tests.ts), and ThemeProvider's mount logic lives in a
// useEffect that cannot run without a renderer. The mount-time decision is
// therefore extracted into the pure `resolveStoredTheme` that the component
// actually calls on mount, so these tests exercise the REAL resolution logic.
//
// Asserts:
//   - no stored preference (null) → dark, no overwrite needed beyond apply (3.1)
//   - invalid stored value → dark AND the stored value is overwritten (3.2)
//   - a supported stored value is reapplied as-is on subsequent loads (3.4)
//
// Validates: Requirements 3.1, 3.2, 3.4
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { resolveStoredTheme } from '../ThemeProvider'

// --- 3.1: no stored preference → dark --------------------------------------
test('resolveStoredTheme: no stored preference resolves to dark (Req 3.1)', () => {
  const { theme, persist } = resolveStoredTheme(null)
  assert.equal(theme, 'dark', 'absent preference must default to dark')
  assert.equal(persist, true, 'absent preference must be written so dark is the stored default')
})

// --- 3.2: invalid stored value → dark AND overwrite ------------------------
test('resolveStoredTheme: invalid stored value resolves to dark and overwrites (Req 3.2)', () => {
  for (const invalid of ['banana', 'system', 'Dark', 'LIGHT', '', 'auto', '0']) {
    const { theme, persist } = resolveStoredTheme(invalid)
    assert.equal(theme, 'dark', `invalid value "${invalid}" must resolve to dark`)
    assert.equal(persist, true, `invalid value "${invalid}" must overwrite the stored preference`)
  }
})

test('resolveStoredTheme: ANY non-supported string resolves to dark + overwrite (Req 3.2)', () => {
  fc.assert(
    fc.property(
      fc.string().filter((s) => s !== 'light' && s !== 'dark'),
      (invalid) => {
        const { theme, persist } = resolveStoredTheme(invalid)
        assert.equal(theme, 'dark')
        assert.equal(persist, true)
      }
    ),
    { numRuns: 200 }
  )
})

// --- 3.4: a supported stored value is reapplied as-is ----------------------
// Persistence (Req 3.4) means a previously-stored supported selection is
// reapplied verbatim on the next load, with no overwrite of the user's choice.
test('resolveStoredTheme: supported stored value is reapplied without overwrite (Req 3.4)', () => {
  for (const valid of ['light', 'dark'] as const) {
    const { theme, persist } = resolveStoredTheme(valid)
    assert.equal(theme, valid, `stored "${valid}" must be reapplied as-is`)
    assert.equal(persist, false, `stored "${valid}" is a user selection and must not be overwritten`)
  }
})
