import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { db } from '@/lib/db/client'
import { debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { formatDebateExport } from '@/app/api/debates/[id]/export/format'

function getArg(name: string): string | null {
  const index = process.argv.findIndex(arg => arg === name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

async function main() {
  const debateId = getArg('--debate') || process.argv[2]
  const outPath = getArg('--out')

  if (!debateId) {
    console.error('Usage: npm run debate:export -- --debate <debateId> [--out exports/debate.json]')
    process.exit(1)
  }

  const debate = await db.query.debates.findFirst({
    where: eq(debates.id, debateId),
    with: {
      topic: true,
      proModel: true,
      conModel: true,
      proPersona: true,
      conPersona: true,
      turns: {
        with: {
          model: true,
          factChecks: true,
        },
        orderBy: (turns, { asc }) => [asc(turns.roundNumber), asc(turns.createdAt)],
      },
      evaluations: true,
      llmProviderCalls: true,
    },
  })

  if (!debate) {
    throw new Error(`Debate not found: ${debateId}`)
  }

  const exportData = formatDebateExport(debate)
  const json = JSON.stringify(exportData, null, 2)

  if (outPath) {
    const absoluteOutPath = resolve(process.cwd(), outPath)
    await mkdir(dirname(absoluteOutPath), { recursive: true })
    await writeFile(absoluteOutPath, json, 'utf8')
    console.log(`[Export] Wrote ${absoluteOutPath}`)
  } else {
    console.log(json)
  }
}

main().catch(error => {
  console.error('[Export] Failed')
  console.error(error)
  process.exit(1)
})
