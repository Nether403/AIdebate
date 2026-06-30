// Feature: showcase-redesign, Property 2: Theme-aware contrast meets WCAG thresholds
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  CONTRAST_PAIRINGS,
  MIN_CONTRAST,
  contrastRatio,
  resolveToken,
  type ContrastPairing,
} from '../tokens'

/**
 * Property 2: Theme-aware contrast meets WCAG thresholds.
 *
 * For all (Theme_Mode, text-role, surface) color-token pairings used by the
 * Design_System, the computed WCAG 2.1 contrast ratio is at least 4.5:1 for
 * body text and at least 3:1 for large text and meaningful non-text UI
 * (including the focus-indicator ring against its background).
 *
 * Validates: Requirements 2.6, 8.3, 8.4, 10.1
 */

function assertPairingMeetsThreshold(pairing: ContrastPairing): void {
  const text = resolveToken(pairing.text, pairing.theme)
  const surface = resolveToken(pairing.surface, pairing.theme)
  const ratio = contrastRatio(text, surface)
  const min = MIN_CONTRAST[pairing.role]
  assert.ok(
    ratio >= min,
    `${pairing.theme}/${pairing.role}: ${pairing.text} on ${pairing.surface} ` +
      `had contrast ${ratio.toFixed(2)}:1, below required ${min}:1`
  )
}

test('Property 2: theme-aware contrast meets WCAG thresholds', () => {
  fc.assert(
    fc.property(fc.constantFrom(...CONTRAST_PAIRINGS), assertPairingMeetsThreshold),
    { numRuns: 100 }
  )

  // The pairing set is finite; sampling alone could skip a pairing. Assert the
  // invariant exhaustively over the enumerated set so none is left unchecked.
  for (const pairing of CONTRAST_PAIRINGS) {
    assertPairingMeetsThreshold(pairing)
  }
})
