import { db } from '@/lib/db/client'
import { benchmarkRuns, debates, modelSnapshots, models } from '@/lib/db/schema'
import { createDebateEngine } from '@/lib/debate/engine'
import { executeDebate } from '@/lib/debate/executor'
import { eq, inArray } from 'drizzle-orm'
import type { BenchmarkRunConfig } from './config'
import { summarizeBenchmarkStatuses } from './summary'
import { collectPendingSnapshots } from './snapshots'
import { getTopicSetTopicIds, resolveTopicSetSelections } from '@/lib/topics/topic-sets'
import { getRunCeilings, isRunCostTripped, InvalidCostCeilingError } from '@/lib/cost/governor'

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

  // Read + validate cost ceilings before launching any debate (Req 3.1). If a
  // stored ceiling is invalid/out-of-range it reaches evaluation here; fail the
  // run before dispatching any debate rather than running unbounded (Req 3.4).
  // No dedicated failure-reason column exists on benchmark_runs, so the reason
  // is logged and the run is marked failed.
  try {
    await getRunCeilings(benchmarkRunId)
  } catch (error) {
    if (error instanceof InvalidCostCeilingError) {
      console.error(
        `[Benchmark] Run ${benchmarkRunId} failed cost-ceiling validation before dispatch:`,
        error.message
      )
      await db.update(benchmarkRuns)
        .set({ status: 'failed', completedAt: new Date() })
        .where(eq(benchmarkRuns.id, benchmarkRunId))

      return {
        benchmarkRunId,
        debateIds: [],
        status: 'failed',
        completedDebates: 0,
        failedDebates: 0,
        evaluationFailedDebates: 0,
        modelSnapshotCount: 0,
      }
    }
    throw error
  }

  const modelSnapshotCount = await persistModelSnapshots(benchmarkRunId, config)

  // Resolve any topic-set references into concrete topicIds (round-robin across
  // each set) before execution, so debates draw reproducibly from a fixed pool.
  const uniqueSetIds = Array.from(new Set(
    config.debates.map(debate => debate.topicSetId).filter((id): id is string => !!id)
  ))
  const setTopicIds = new Map<string, string[]>()
  for (const setId of uniqueSetIds) {
    setTopicIds.set(setId, await getTopicSetTopicIds(setId))
  }
  const resolvedDebates = resolveTopicSetSelections(config.debates, setTopicIds)

  try {
    for (const debateConfig of resolvedDebates) {
      // Preventive per-run gate (Req 2.3): once the run's accumulated cost has
      // tripped its per-run ceiling, stop starting new debates. Remaining
      // not-yet-started debates simply aren't launched; already-started debates
      // are unaffected here and the final summary still reflects their status.
      // Up-front validation already ran, so isRunCostTripped won't throw for an
      // invalid ceiling; any other transient error fails closed (stop launching)
      // so the run never keeps spending past an unknown cost state.
      let runTripped = false
      try {
        runTripped = await isRunCostTripped(benchmarkRunId)
        if (runTripped) {
          console.warn(
            `[Benchmark] Run ${benchmarkRunId} hit its per-run cost ceiling; stopping launch of further debates.`
          )
        }
      } catch (error) {
        console.error(
          `[Benchmark] Run ${benchmarkRunId} cost-gate check failed; stopping launch of further debates:`,
          error instanceof Error ? error.message : error
        )
        runTripped = true
      }
      if (runTripped) break

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
