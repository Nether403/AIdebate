import { getModelConfig } from '@/lib/llm/model-config'
import type { BenchmarkDebateConfig } from './config'

export type SnapshotRole = 'pro' | 'con' | 'judge' | 'fact-checker'

export interface PendingModelSnapshot {
  role: SnapshotRole
  modelId: string | null
  provider: string
  providerModelId: string
  displayName: string | null
  metadata: Record<string, unknown>
}

/**
 * Collect unique model snapshots for a benchmark run.
 *
 * - Pro and Con snapshots use the database model id from the debate config; provider
 *   and providerModelId are resolved later when the model row is loaded.
 * - Judge and fact-checker snapshots come from the central infrastructure model config
 *   so the snapshot captures exactly which provider/model served those roles.
 *
 * Deduplication uses (role, modelId or providerModelId). Persisting duplicates would
 * inflate the snapshot count and make downstream comparisons harder.
 */
export function collectPendingSnapshots(debates: BenchmarkDebateConfig[]): PendingModelSnapshot[] {
  const seen = new Set<string>()
  const snapshots: PendingModelSnapshot[] = []

  for (const debate of debates) {
    for (const [role, modelId] of [
      ['pro', debate.proModelId] as const,
      ['con', debate.conModelId] as const,
    ]) {
      const key = `${role}:${modelId}`
      if (seen.has(key)) continue
      seen.add(key)
      snapshots.push({
        role,
        modelId,
        provider: 'pending',
        providerModelId: 'pending',
        displayName: null,
        metadata: {
          resolvedFrom: 'benchmark-config',
          debateConfigFields: ['proModelId', 'conModelId'],
        },
      })
    }
  }

  const judgeConfig = getModelConfig('judge')
  const judgeKey = `judge:${judgeConfig.provider}:${judgeConfig.model}`
  if (!seen.has(judgeKey)) {
    seen.add(judgeKey)
    snapshots.push({
      role: 'judge',
      modelId: null,
      provider: judgeConfig.provider,
      providerModelId: judgeConfig.model,
      displayName: null,
      metadata: {
        resolvedFrom: 'getModelConfig',
        role: 'judge',
      },
    })
  }

  const factCheckerConfig = getModelConfig('fact-checker')
  const factCheckerKey = `fact-checker:${factCheckerConfig.provider}:${factCheckerConfig.model}`
  if (!seen.has(factCheckerKey)) {
    seen.add(factCheckerKey)
    snapshots.push({
      role: 'fact-checker',
      modelId: null,
      provider: factCheckerConfig.provider,
      providerModelId: factCheckerConfig.model,
      displayName: null,
      metadata: {
        resolvedFrom: 'getModelConfig',
        role: 'fact-checker',
      },
    })
  }

  return snapshots
}
