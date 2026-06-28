import { db } from '@/lib/db/client'
import { benchmarkRuns, debates, modelSnapshots, models } from '@/lib/db/schema'
import { createDebateEngine } from '@/lib/debate/engine'
import { executeDebate } from '@/lib/debate/executor'
import { eq, inArray } from 'drizzle-orm'
import type { BenchmarkRunConfig } from './config'
import { summarizeBenchmarkStatuses } from './summary'
import { collectPendingSnapshots } from './snapshots'

export interface BenchmarkRunResult {
  benchmarkRunId: string
  debateIds: string[]
  status: 'completed' | 'failed'
  completedDebates: number
  failedDebates: number
  evaluationFailedDebates: number
  modelSnapshotCount: number
}

export async function createBenchmarkRun(config: BenchmarkRunConfig): Promise<string> {
  const [run] = await db.insert(benchmarkRuns).values({
    name: config.name,
    description: config.description || null,
    status: 'pending',
    config,
    totalDebates: config.debates.length,
    completedDebates: 0,
    failedDebates: 0,
    evaluationFailedDebates: 0,
    startedAt: null,
    completedAt: null,
  }).returning({ id: benchmarkRuns.id })

  return run.id
}

/**
 * Persist model snapshots for a benchmark run.
 *
 * Debater snapshots resolve provider/providerModelId from the active models table so
 * downstream analysis can tie a benchmark run to the exact (provider, providerModelId)
 * pair served at run time. Judge and fact-checker snapshots come from the central
 * infrastructure model config.
 */
async function persistModelSnapshots(benchmarkRunId: string, config: BenchmarkRunConfig): Promise<number> {
  const pendingSnapshots = collectPendingSnapshots(config.debates)

  const debaterModelIds = pendingSnapshots
    .filter(snapshot => snapshot.modelId && (snapshot.role === 'pro' || snapshot.role === 'con'))
    .map(snapshot => snapshot.modelId!)

  const uniqueModelIds = Array.from(new Set(debaterModelIds))
  const modelRows = uniqueModelIds.length > 0
    ? await db.select({
        id: models.id,
        name: models.name,
        provider: models.provider,
        modelId: models.modelId,
      }).from(models).where(inArray(models.id, uniqueModelIds))
    : []

  const modelLookup = new Map(modelRows.map(row => [row.id, row]))

  const resolved = pendingSnapshots.map(snapshot => {
    if (snapshot.modelId && modelLookup.has(snapshot.modelId)) {
      const row = modelLookup.get(snapshot.modelId)!
      return {
        ...snapshot,
        provider: row.provider,
        providerModelId: row.modelId,
        displayName: row.name,
      }
    }
    return snapshot
  })

  if (resolved.length === 0) return 0

  await db.insert(modelSnapshots).values(resolved.map(snapshot => ({
    benchmarkRunId,
    modelId: snapshot.modelId,
    provider: snapshot.provider,
    providerModelId: snapshot.providerModelId,
    displayName: snapshot.displayName,
    role: snapshot.role,
    metadata: snapshot.metadata,
  })))

  return resolved.length
}

export async function runBenchmark(config: BenchmarkRunConfig): Promise<BenchmarkRunResult> {
  const benchmarkRunId = await createBenchmarkRun(config)
  const engine = createDebateEngine()
  const debateIds: string[] = []

  await db.update(benchmarkRuns)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(benchmarkRuns.id, benchmarkRunId))

  const modelSnapshotCount = await persistModelSnapshots(benchmarkRunId, config)

  try {
    for (const debateConfig of config.debates) {
      // Isolate each debate: a single failed/evaluation_failed/throwing debate
      // must not abort the whole run. executeDebate persists the failure state
      // with diagnostics; we log and continue so remaining debates still run and
      // the run summary reflects every debate's actual status.
      let debateId: string | undefined
      try {
        const session = await engine.initializeDebate({
          ...debateConfig,
          benchmarkRunId,
        })

        debateId = session.id
        debateIds.push(session.id)
        await engine.startDebate(session.id)
        await executeDebate(session.id)
      } catch (error) {
        console.error(
          `[Benchmark] Debate ${debateId ?? '(initialization failed)'} did not complete:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    const finalDebates = debateIds.length > 0
      ? await db.select({ status: debates.status })
        .from(debates)
        .where(inArray(debates.id, debateIds))
      : []

    const summary = summarizeBenchmarkStatuses(finalDebates.map(debate => debate.status))

    await db.update(benchmarkRuns)
      .set({
        status: summary.status,
        completedDebates: summary.completedDebates,
        failedDebates: summary.failedDebates,
        evaluationFailedDebates: summary.evaluationFailedDebates,
        completedAt: new Date(),
      })
      .where(eq(benchmarkRuns.id, benchmarkRunId))

    return {
      benchmarkRunId,
      debateIds,
      ...summary,
      modelSnapshotCount,
    }
  } catch (error) {
    await db.update(benchmarkRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
      })
      .where(eq(benchmarkRuns.id, benchmarkRunId))

    throw error
  }
}
