import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { db } from '@/lib/db/client'
import { benchmarkRuns, datasetExports, debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { formatDebateExport } from '@/app/api/debates/[id]/export/format'

function getArg(name: string): string | null {
  const index = process.argv.findIndex(arg => arg === name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

function toJsonl(records: unknown[]): string {
  return records.map(record => JSON.stringify(record)).join('\n') + '\n'
}

async function main() {
  const runId = getArg('--run') || process.argv[2]
  const outDir = getArg('--out')

  if (!runId || !outDir) {
    console.error('Usage: npm run dataset:export -- --run <benchmarkRunId> --out exports/<benchmarkRunId>')
    process.exit(1)
  }

  const benchmarkRun = await db.query.benchmarkRuns.findFirst({
    where: eq(benchmarkRuns.id, runId),
  })

  if (!benchmarkRun) {
    throw new Error(`Benchmark run not found: ${runId}`)
  }

  const debateRecords = await db.query.debates.findMany({
    where: eq(debates.benchmarkRunId, runId),
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

  const completeDebates = debateRecords.filter(debate => debate.status === 'completed')
  const excludedDebates = debateRecords.filter(debate => debate.status !== 'completed')
  const formattedDebates = completeDebates.map(debate => formatDebateExport(debate))
  const absoluteOutDir = resolve(process.cwd(), outDir)
  const datasetPath = join(absoluteOutDir, 'debates.jsonl')
  const manifestPath = join(absoluteOutDir, 'manifest.json')

  const manifest = {
    benchmarkRunId: runId,
    benchmarkRun: {
      name: benchmarkRun.name,
      description: benchmarkRun.description,
      status: benchmarkRun.status,
      config: benchmarkRun.config,
      startedAt: benchmarkRun.startedAt,
      completedAt: benchmarkRun.completedAt,
    },
    exportedAt: new Date().toISOString(),
    schemaVersion: 'dataset-export-v1',
    files: {
      debatesJsonl: 'debates.jsonl',
    },
    counts: {
      totalDebates: debateRecords.length,
      exportedDebates: completeDebates.length,
      excludedDebates: excludedDebates.length,
      completedDebates: completeDebates.length,
      failedDebates: excludedDebates.filter(debate => debate.status === 'failed').length,
      evaluationFailedDebates: excludedDebates.filter(debate => debate.status === 'evaluation_failed').length,
    },
    excludedDebateIds: excludedDebates.map(debate => ({
      id: debate.id,
      status: debate.status,
      errorState: debate.errorState,
    })),
  }

  await mkdir(absoluteOutDir, { recursive: true })
  await writeFile(datasetPath, toJsonl(formattedDebates), 'utf8')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  await db.insert(datasetExports).values({
    benchmarkRunId: runId,
    format: 'jsonl',
    path: absoluteOutDir,
    manifest,
  })

  console.log('[Dataset Export] Completed')
  console.log(JSON.stringify({ datasetPath, manifestPath, ...manifest.counts }, null, 2))
}

main().catch(error => {
  console.error('[Dataset Export] Failed')
  console.error(error)
  process.exit(1)
})
