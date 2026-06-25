import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { db } from '@/lib/db/client'
import { benchmarkRuns, datasetExports, debates, modelSnapshots } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  DATASET_EXPORT_SCHEMA_VERSION,
  buildModelMetrics,
  formatModelMetricsCsv,
  toDebateRow,
  toFactCheckRows,
  toJsonl,
  toJudgeEvaluationRows,
  toProviderCallRows,
  toTurnRows,
} from '@/lib/benchmark/dataset'

function getArg(name: string): string | null {
  const index = process.argv.findIndex(arg => arg === name)
  return index >= 0 ? process.argv[index + 1] || null : null
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

  const snapshotRecords = await db.select().from(modelSnapshots).where(eq(modelSnapshots.benchmarkRunId, runId))

  const completeDebates = debateRecords.filter(debate => debate.status === 'completed')
  const excludedDebates = debateRecords.filter(debate => debate.status !== 'completed')

  const debateRows = completeDebates.map(toDebateRow)
  const turnRows = completeDebates.flatMap(toTurnRows)
  const factCheckRows = completeDebates.flatMap(toFactCheckRows)
  const judgeEvaluationRows = completeDebates.flatMap(toJudgeEvaluationRows)
  const providerCallRows = completeDebates.flatMap(toProviderCallRows)
  const modelMetrics = buildModelMetrics(completeDebates)

  const absoluteOutDir = resolve(process.cwd(), outDir)
  await mkdir(absoluteOutDir, { recursive: true })

  const files = {
    debatesJsonl: 'debates.jsonl',
    turnsJsonl: 'turns.jsonl',
    factChecksJsonl: 'fact_checks.jsonl',
    judgeEvaluationsJsonl: 'judge_evaluations.jsonl',
    providerCallsJsonl: 'provider_calls.jsonl',
    modelSnapshotsJsonl: 'model_snapshots.jsonl',
    modelMetricsCsv: 'model_metrics.csv',
    manifest: 'manifest.json',
  } as const

  const filesWritten: Array<{ file: string; rows: number }> = []

  async function writeJsonl(name: string, rows: unknown[]) {
    const filepath = join(absoluteOutDir, name)
    await writeFile(filepath, toJsonl(rows), 'utf8')
    filesWritten.push({ file: name, rows: rows.length })
  }

  await writeJsonl(files.debatesJsonl, debateRows)
  await writeJsonl(files.turnsJsonl, turnRows)
  await writeJsonl(files.factChecksJsonl, factCheckRows)
  await writeJsonl(files.judgeEvaluationsJsonl, judgeEvaluationRows)
  await writeJsonl(files.providerCallsJsonl, providerCallRows)
  await writeJsonl(files.modelSnapshotsJsonl, snapshotRecords)

  await writeFile(join(absoluteOutDir, files.modelMetricsCsv), formatModelMetricsCsv(modelMetrics), 'utf8')
  filesWritten.push({ file: files.modelMetricsCsv, rows: modelMetrics.length })

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
    schemaVersion: DATASET_EXPORT_SCHEMA_VERSION,
    files,
    counts: {
      totalDebates: debateRecords.length,
      exportedDebates: completeDebates.length,
      excludedDebates: excludedDebates.length,
      completedDebates: completeDebates.length,
      failedDebates: excludedDebates.filter(debate => debate.status === 'failed').length,
      evaluationFailedDebates: excludedDebates.filter(debate => debate.status === 'evaluation_failed').length,
      turns: turnRows.length,
      factChecks: factCheckRows.length,
      judgeEvaluations: judgeEvaluationRows.length,
      providerCalls: providerCallRows.length,
      modelSnapshots: snapshotRecords.length,
      modelMetrics: modelMetrics.length,
    },
    filesWritten,
    excludedDebateIds: excludedDebates.map(debate => ({
      id: debate.id,
      status: debate.status,
      errorState: debate.errorState,
    })),
  }

  const manifestPath = join(absoluteOutDir, files.manifest)
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  await db.insert(datasetExports).values({
    benchmarkRunId: runId,
    format: 'jsonl',
    outputPath: absoluteOutDir,
    manifest,
    rowCount: completeDebates.length,
  })

  console.log('[Dataset Export] Completed')
  console.log(JSON.stringify({
    outputDir: absoluteOutDir,
    manifestPath,
    counts: manifest.counts,
  }, null, 2))
}

main().catch(error => {
  console.error('[Dataset Export] Failed')
  console.error(error)
  process.exit(1)
})
