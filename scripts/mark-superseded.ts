import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Documentation correction (cost-governor Requirement 9): mark the archived
 * "marketplace of truth" paper as superseded so its stale gamification design
 * stops resurfacing as a false contradiction against the current
 * research-workbench direction.
 *
 * The pure transform (`applySupersedeNotice`) is exported separately from the
 * file IO (`markSuperseded`) so it can be property-tested directly.
 */

/**
 * Confirmed archived "marketplace of truth" paper. This document's section 6,
 * "The Marketplace of Truth: User Interaction and Gamification", proposes the
 * prediction-market design that contradicts the current workbench direction.
 * Path is workspace-relative; resolved against `process.cwd()` by the IO layer.
 */
export const ARCHIVED_PAPER_PATH =
  'docs/archive/research/The Dialectic Engine_ Architecting the Next Generation of Adversarial LLM Evaluation.md'

/**
 * Stable marker identifying an already-applied notice. Its presence anywhere in
 * the content makes `applySupersedeNotice` a no-op, guaranteeing idempotence
 * (Req 9.4). An HTML comment renders invisibly in Markdown.
 */
export const SUPERSEDE_SENTINEL = '<!-- superseded-notice:cost-governor -->'

/**
 * Fixed notice block prepended above all original content (Req 9.1, 9.2).
 * Ends with a blank line so the original content reads cleanly below it. The
 * original content is appended byte-for-byte after this block (Req 9.3).
 */
export const SUPERSEDE_NOTICE = `${SUPERSEDE_SENTINEL}
> # ⚠️ SUPERSEDED — historical reference only
>
> This archived paper is **superseded** and retained for historical reference only.
> Its proposals (including the prediction-market "Marketplace of Truth" gamification)
> do **not** reflect the current direction of this project, which is a lean LLM debate
> benchmarking and alignment-research workbench.
>
> The current source of truth is **\`docs/REVIVAL_ROADMAP.md\`**. Where this document
> conflicts with that roadmap, the roadmap wins.

`

/**
 * Pure, idempotent transform: prepend the supersede notice as the first content
 * block, preserving the original content byte-for-byte below it.
 *
 * Idempotent via the sentinel check: if the content already contains the
 * notice marker, it is returned unchanged so no duplicate notice is added
 * (Req 9.4). Otherwise the notice block is prepended and the original `content`
 * is preserved exactly as the remainder (Req 9.1, 9.3).
 */
export function applySupersedeNotice(content: string): string {
  if (content.includes(SUPERSEDE_SENTINEL)) {
    return content
  }
  return SUPERSEDE_NOTICE + content
}

export interface MarkSupersededResult {
  /** True when the notice was added; false when it was already present. */
  changed: boolean
  /** Absolute path that was inspected/written. */
  path: string
}

/**
 * Read the archived paper, apply the idempotent notice transform, and write it
 * back only when the content actually changes.
 *
 * Fails without partial writes if the file is missing or unreadable (Req 9.5):
 * the read happens before any write, so a read failure throws before the file
 * is ever opened for writing. Re-running on an already-superseded file is a
 * no-op (no write, `changed: false`).
 */
export async function markSuperseded(
  filePath: string = ARCHIVED_PAPER_PATH
): Promise<MarkSupersededResult> {
  const absolutePath = resolve(process.cwd(), filePath)

  let original: string
  try {
    original = await readFile(absolutePath, 'utf8')
  } catch (error) {
    // No partial changes: nothing has been written at this point (Req 9.5).
    throw new Error(
      `Archived paper is missing or unreadable: ${absolutePath} (${(error as Error).message})`
    )
  }

  const updated = applySupersedeNotice(original)
  if (updated === original) {
    return { changed: false, path: absolutePath }
  }

  await writeFile(absolutePath, updated, 'utf8')
  return { changed: true, path: absolutePath }
}

function getArg(name: string): string | null {
  const index = process.argv.findIndex(arg => arg === name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

async function main() {
  const filePath = getArg('--file') || process.argv[2] || ARCHIVED_PAPER_PATH
  const result = await markSuperseded(filePath)
  if (result.changed) {
    console.log(`[Supersede] Prepended notice to ${result.path}`)
  } else {
    console.log(`[Supersede] Notice already present, no change: ${result.path}`)
  }
}

// Only run when invoked directly (not when imported by a test). Robust on
// Windows via pathToFileURL, which normalizes drive letters and separators.
const invokedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  main().catch(error => {
    console.error('[Supersede] Failed')
    console.error(error)
    process.exit(1)
  })
}
