// Feature: cost-governor, Task 15.3: supersede ordering + missing-file error path
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  applySupersedeNotice,
  markSuperseded,
  SUPERSEDE_SENTINEL,
} from '../mark-superseded'

/**
 * Notice-first ordering + roadmap reference (Req 9.1, 9.2).
 *
 * The transform is pure, so a representative sample doc with its own leading
 * heading is enough to prove the notice lands above all original content and
 * that the notice cites the canonical roadmap.
 */
describe('applySupersedeNotice - notice-first ordering and roadmap reference', () => {
  const sampleDoc = [
    '# The Marketplace of Truth',
    '',
    '## 6. User Interaction and Gamification',
    '',
    'Original body content that must remain below the notice.',
    '',
  ].join('\n')

  it('places the notice as the first content block, above the original heading (Req 9.1)', () => {
    const output = applySupersedeNotice(sampleDoc)

    // The very first content block is the notice (its sentinel sits at index 0).
    assert.equal(
      output.indexOf(SUPERSEDE_SENTINEL),
      0,
      'notice sentinel must be the first thing in the document'
    )

    // The notice precedes the original first heading (ordering, not just presence).
    const noticePos = output.indexOf(SUPERSEDE_SENTINEL)
    const originalHeadingPos = output.indexOf('# The Marketplace of Truth')
    assert.ok(originalHeadingPos > noticePos, 'original heading must come after the notice')

    // Original content is preserved verbatim below the notice (Req 9.3 sanity).
    assert.ok(output.endsWith(sampleDoc), 'original content must be preserved below the notice')
  })

  it('references docs/REVIVAL_ROADMAP.md as the current source of truth (Req 9.2)', () => {
    const output = applySupersedeNotice(sampleDoc)
    assert.match(output, /docs\/REVIVAL_ROADMAP\.md/)
    assert.match(output, /source of truth/i)
  })
})

/**
 * Missing-file error path (Req 9.5): markSuperseded on a nonexistent path must
 * reject with an error and make NO partial write.
 */
describe('markSuperseded - missing-file error path (Req 9.5)', () => {
  let tempDir: string
  let missingPath: string

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mark-superseded-'))
    // A path guaranteed not to exist inside the fresh temp dir.
    missingPath = join(tempDir, 'does-not-exist', 'archived-paper.md')
  })

  after(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('rejects with an error and creates no file when the target is missing', async () => {
    await assert.rejects(
      () => markSuperseded(missingPath),
      /missing or unreadable/i,
      'markSuperseded must reject when the target file does not exist'
    )

    // No partial write: the file must still not exist after the failed call.
    await assert.rejects(
      () => access(missingPath),
      'markSuperseded must not create the file on the error path'
    )
  })
})
