import { db } from '@/lib/db/client'
import { benchmarkRuns, debates } from '@/lib/db/schema'
import { createDebateEngine } from '@/lib/debate/engine'
import { executeDebate } from '@/lib/debate/executor'
import { eq, inArray } from 'drizzle-orm'
import type { BenchmarkRunConfig } from './config'
import { summarizeBenchmarkStatuses } from './summary'

export interface BenchmarkRunResult {
  benchmarkRunId: string
  debateIds: string[]
  status: 'completed' | 'failed'
  completedDebates: number
  failedDebates: number
  evaluationFailedDebates: number
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

export async function runBenchmark(config: BenchmarkRunConfig): Promise<BenchmarkRunResult> {
  const benchmarkRunId = await createBenchmarkRun(config)
  const engine = createDebateEngine()
  const debateIds: string[] = []

  await db.update(benchmarkRuns)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(benchmarkRuns.id, benchmarkRunId))

  try {
    for (const debateConfig of config.debates) {
      const session = await engine.initializeDebate({
        ...debateConfig,
        benchmarkRunId,
      })

      debateIds.push(session.id)
      await engine.startDebate(session.id)
      await executeDebate(session.id)
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
