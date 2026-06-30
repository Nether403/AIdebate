// Feature: showcase-redesign, Property 1: Token resolution is total with theme fallback
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  resolveToken,
  TOKEN_NAMES,
  TOKENS,
  DEFAULT_THEME,
  type ThemeMode,
} from '../tokens'

/**
 * Property 1: Token resolution is total with theme fallback.
 *
 * For all declared token names and for all ThemeModes ('light','dark'),
 * resolveToken(name, theme) returns a non-empty value. When a token has no
 * value scoped to the active theme, the resolver returns the default (dark)
 * theme value rather than empty/undefined/transparent.
 *
 * Non-color tokens (glow, typography, spacing, radius, elevation, motion) are
 * never theme-scoped, so they are by construction absent from the light scope:
 * resolving them under 'light' must equal resolving them under 'dark'.
 *
 * Validates: Requirements 10.2, 10.4
 */

const themeArb: fc.Arbitrary<ThemeMode> = fc.constantFrom('light', 'dark')

// Declared names exercise the resolution path; arbitrary strings exercise the
// unknown-name totality branch (the resolver must still return a value).
const nameArb: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(...(TOKEN_NAMES as readonly string[])),
  fc.string()
)

// Declared tokens that have no light-theme override (everything that isn't a
// color token). Used to assert the dark-theme fallback behavior.
const nonColorTokenNames = TOKENS.filter((t) => t.category !== 'color').map(
  (t) => t.name
)

function isNonEmptyValue(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value !== 'transparent' &&
    value !== 'undefined' &&
    value !== 'null'
  )
}

test('Property 1: token resolution is total with theme fallback', () => {
  // Sanity: the default fallback theme is dark, as the property assumes.
  assert.equal(DEFAULT_THEME, 'dark')

  fc.assert(
    fc.property(nameArb, themeArb, (name, theme) => {
      const resolved = resolveToken(name, theme)
      assert.ok(
        isNonEmptyValue(resolved),
        `resolveToken(${JSON.stringify(name)}, ${theme}) returned an empty/invalid value: ${JSON.stringify(resolved)}`
      )

      // Fallback behavior: a token absent from the light scope resolves under
      // 'light' to the same value it has under 'dark'.
      if (theme === 'light' && nonColorTokenNames.includes(name as never)) {
        assert.equal(
          resolveToken(name, 'light'),
          resolveToken(name, 'dark'),
          `token ${name} has no light override and must fall back to the dark value`
        )
      }
    }),
    { numRuns: 200 }
  )
})
