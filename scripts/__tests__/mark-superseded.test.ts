// Feature: cost-governor, Property 11: Document supersede is idempotent and preserves the original
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  applySupersedeNotice,
  SUPERSEDE_SENTINEL,
  SUPERSEDE_NOTICE,
} from '../mark-superseded'

// Full-Unicode string including astral-plane code points, so "byte-for-byte"
// preservation is genuinely exercised. fast-check v4 dropped fullUnicodeString;
// `unit: 'binary'` is its replacement for any-code-point content.
const unicodeText = (): fc.Arbitrary<string> => fc.string({ unit: 'binary' })

// Document-content generator spanning the input space the property must hold
// over: empty content, plain/Unicode text, and content that already embeds the
// sentinel/notice (the idempotence trigger).
const documentContent = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.constant(''),
    fc.string(),
    unicodeText(),
    // Notice/sentinel already present somewhere in the content.
    fc.tuple(unicodeText(), unicodeText()).map(
      ([before, after]) => `${before}${SUPERSEDE_SENTINEL}${after}`
    ),
    unicodeText().map((after) => `${SUPERSEDE_NOTICE}${after}`)
  )

// Content guaranteed NOT to already contain the sentinel, so the notice is
// actually prepended (the Req 9.3 path).
const freshContent = (): fc.Arbitrary<string> =>
  fc
    .oneof(fc.constant(''), fc.string(), unicodeText())
    .filter((c) => !c.includes(SUPERSEDE_SENTINEL))

describe('applySupersedeNotice - Property 11: idempotent and preserves the original', () => {
  it('Req 9.3: first block is the notice and the remainder is the original byte-for-byte', () => {
    fc.assert(
      fc.property(freshContent(), (content) => {
        const output = applySupersedeNotice(content)

        // The output begins with the fixed notice block as its first content.
        assert.ok(output.startsWith(SUPERSEDE_NOTICE))

        // Everything after the notice block is the original content, unmodified.
        const remainder = output.slice(SUPERSEDE_NOTICE.length)
        assert.equal(remainder, content)

        // Equivalently: output is exactly notice + original (no other edits).
        assert.equal(output, SUPERSEDE_NOTICE + content)
      }),
      { numRuns: 100 }
    )
  })

  it('Req 9.4: applying twice equals applying once (idempotence, no duplicate notice)', () => {
    fc.assert(
      fc.property(documentContent(), (content) => {
        const once = applySupersedeNotice(content)
        const twice = applySupersedeNotice(once)
        assert.equal(twice, once)

        // The sentinel never appears more than the input already had (+1 at most).
        const inputCount = content.split(SUPERSEDE_SENTINEL).length - 1
        const onceCount = once.split(SUPERSEDE_SENTINEL).length - 1
        assert.equal(onceCount, Math.max(inputCount, 1))
      }),
      { numRuns: 100 }
    )
  })
})
