/**
 * Pure helpers for building per-table dataset export rows from a loaded debate graph.
 *
 * These functions contain no database or filesystem side effects. The export script
 * (and its tests) use them to produce JSONL/CSV artifacts for a benchmark run.
 */

export const DATASET_EXPORT_SCHEMA_VERSION = 'dataset-export-v2'

export interface DebateRow {
  debateId: string
  benchmarkRunId: string | null
  status: string
  topicId: string
  topicMotion: string
  topicCategory: string
  topicDifficulty: string
  topicSource: string | null
  proModelId: string
  proModelProvider: string
  proModelModelId: string
  proModelName: string
  conModelId: string
  conModelProvider: string
  conModelModelId: string
  conModelName: string
  proPersonaName: string | null
  conPersonaName: string | null
  totalRounds: number
  factCheckMode: string
  wordLimitPerTurn: number
  judgeProvider: string | null
  judgeModel: string | null
  factCheckerProvider: string | null
  factCheckerModel: string | null
  promptVersion: string | null
  generationParams: unknown
  winner: string | null
  aiJudgeWinner: string | null
  errorState: unknown
  createdAt: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface TurnRow {
  debateId: string
  benchmarkRunId: string | null
  turnId: string
  roundNumber: number
  side: string
  modelId: string
  modelName: string | null
  wasRejected: boolean
  retryCount: number
  wordCount: number
  factChecksPassed: number
  factChecksFailed: number
  reflection: string | null
  critique: string | null
  speech: string
  tokensUsed: number | null
  latencyMs: number | null
  provider: string | null
  actualModelId: string | null
  costEstimate: number | null
  createdAt: string | null
}

export interface FactCheckRow {
  debateId: string
  benchmarkRunId: string | null
  turnId: string
  factCheckId: string
  claim: string
  verdict: string
  confidence: number | null
  reasoning: string | null
  sources: unknown
  createdAt: string | null
}

export interface JudgeEvaluationRow {
  debateId: string
  benchmarkRunId: string | null
  evaluationId: string
  judgeProvider: string | null
  judgeModel: string | null
  evaluationOrder: string
  winner: string | null
  proScore: number | null
  conScore: number | null
  rubricScores: unknown
  reasoning: string | null
  positionBiasDetected: boolean
  parseStatus: string | null
  rawResponse: string | null
  errorMessage: string | null
  promptVersion: string | null
  schemaVersion: string | null
  consensus: boolean | null
  tiebreakerUsed: boolean | null
  createdAt: string | null
}

export interface ProviderCallRow {
  debateId: string | null
  benchmarkRunId: string | null
  debateTurnId: string | null
  providerCallId: string
  stage: string
  provider: string
  requestedModel: string
  actualModel: string | null
  promptVersion: string | null
  generationParams: unknown
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  latencyMs: number | null
  costEstimate: number | null
  status: string
  errorMessage: string | null
  createdAt: string | null
}

export interface ModelMetricsRow {
  providerModelId: string
  provider: string
  displayName: string
  completedDebates: number
  wins: number
  losses: number
  ties: number
  unknownOutcomes: number
  evaluationFailed: number
  failedExecution: number
  asProDebates: number
  asConDebates: number
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return typeof value === 'string' ? value : null
}

/**
 * Flatten a debate row without embedded turns/fact-checks/evaluations.
 */
export function toDebateRow(debate: any): DebateRow {
  return {
    debateId: debate.id,
    benchmarkRunId: debate.benchmarkRunId ?? null,
    status: debate.status,
    topicId: debate.topicId,
    topicMotion: debate.topic?.motion ?? '',
    topicCategory: debate.topic?.category ?? '',
    topicDifficulty: debate.topic?.difficulty ?? '',
    topicSource: debate.topic?.source ?? null,
    proModelId: debate.proModelId,
    proModelProvider: debate.proModel?.provider ?? '',
    proModelModelId: debate.proModel?.modelId ?? '',
    proModelName: debate.proModel?.name ?? '',
    conModelId: debate.conModelId,
    conModelProvider: debate.conModel?.provider ?? '',
    conModelModelId: debate.conModel?.modelId ?? '',
    conModelName: debate.conModel?.name ?? '',
    proPersonaName: debate.proPersona?.name ?? null,
    conPersonaName: debate.conPersona?.name ?? null,
    totalRounds: debate.totalRounds,
    factCheckMode: debate.factCheckMode,
    wordLimitPerTurn: debate.wordLimitPerTurn,
    judgeProvider: debate.judgeProvider ?? null,
    judgeModel: debate.judgeModel ?? null,
    factCheckerProvider: debate.factCheckerProvider ?? null,
    factCheckerModel: debate.factCheckerModel ?? null,
    promptVersion: debate.promptVersion ?? null,
    generationParams: debate.generationParams ?? null,
    winner: debate.winner ?? null,
    aiJudgeWinner: debate.aiJudgeWinner ?? null,
    errorState: debate.errorState ?? null,
    createdAt: toIso(debate.createdAt),
    startedAt: toIso(debate.startedAt),
    completedAt: toIso(debate.completedAt),
  }
}

export function toTurnRows(debate: any): TurnRow[] {
  const turns: any[] = debate.turns || []
  return turns.map(turn => ({
    debateId: debate.id,
    benchmarkRunId: debate.benchmarkRunId ?? null,
    turnId: turn.id,
    roundNumber: turn.roundNumber,
    side: turn.side,
    modelId: turn.modelId,
    modelName: turn.model?.name ?? null,
    wasRejected: !!turn.wasRejected,
    retryCount: turn.retryCount ?? 0,
    wordCount: turn.wordCount,
    factChecksPassed: turn.factChecksPassed ?? 0,
    factChecksFailed: turn.factChecksFailed ?? 0,
    reflection: turn.reflection ?? null,
    critique: turn.critique ?? null,
    speech: turn.speech,
    tokensUsed: turn.tokensUsed ?? null,
    latencyMs: turn.latencyMs ?? null,
    provider: turn.provider ?? null,
    actualModelId: turn.actualModelId ?? null,
    costEstimate: turn.costEstimate ?? null,
    createdAt: toIso(turn.createdAt),
  }))
}

export function toFactCheckRows(debate: any): FactCheckRow[] {
  const rows: FactCheckRow[] = []
  const turns: any[] = debate.turns || []
  for (const turn of turns) {
    const factChecks: any[] = turn.factChecks || []
    for (const fc of factChecks) {
      rows.push({
        debateId: debate.id,
        benchmarkRunId: debate.benchmarkRunId ?? null,
        turnId: turn.id,
        factCheckId: fc.id,
        claim: fc.claim,
        verdict: fc.verdict,
        confidence: fc.confidence ?? null,
        reasoning: fc.reasoning ?? null,
        sources: fc.sources ?? null,
        createdAt: toIso(fc.createdAt),
      })
    }
  }
  return rows
}

export function toJudgeEvaluationRows(debate: any): JudgeEvaluationRow[] {
  const evaluations: any[] = debate.evaluations || []
  return evaluations.map(ev => ({
    debateId: debate.id,
    benchmarkRunId: debate.benchmarkRunId ?? null,
    evaluationId: ev.id,
    judgeProvider: ev.judgeProvider ?? null,
    judgeModel: ev.judgeModel ?? null,
    evaluationOrder: ev.evaluationOrder,
    winner: ev.winner ?? null,
    proScore: ev.proScore ?? null,
    conScore: ev.conScore ?? null,
    rubricScores: ev.rubricScores ?? null,
    reasoning: ev.reasoning ?? null,
    positionBiasDetected: !!ev.positionBiasDetected,
    parseStatus: ev.parseStatus ?? null,
    rawResponse: ev.rawResponse ?? null,
    errorMessage: ev.errorMessage ?? null,
    promptVersion: ev.promptVersion ?? null,
    schemaVersion: ev.schemaVersion ?? null,
    consensus: ev.consensus ?? null,
    tiebreakerUsed: ev.tiebreakerUsed ?? null,
    createdAt: toIso(ev.createdAt),
  }))
}

export function toProviderCallRows(debate: any): ProviderCallRow[] {
  const calls: any[] = debate.llmProviderCalls || []
  return calls.map(call => ({
    debateId: call.debateId ?? debate.id,
    benchmarkRunId: call.benchmarkRunId ?? debate.benchmarkRunId ?? null,
    debateTurnId: call.debateTurnId ?? null,
    providerCallId: call.id,
    stage: call.stage,
    provider: call.provider,
    requestedModel: call.requestedModel,
    actualModel: call.actualModel ?? null,
    promptVersion: call.promptVersion ?? null,
    generationParams: call.generationParams ?? null,
    inputTokens: call.inputTokens ?? null,
    outputTokens: call.outputTokens ?? null,
    totalTokens: call.totalTokens ?? null,
    latencyMs: call.latencyMs ?? null,
    costEstimate: call.costEstimate ?? null,
    status: call.status ?? 'success',
    errorMessage: call.errorMessage ?? null,
    createdAt: toIso(call.createdAt),
  }))
}

interface MetricsAccumulator {
  providerModelId: string
  provider: string
  displayName: string
  completedDebates: number
  wins: number
  losses: number
  ties: number
  unknownOutcomes: number
  evaluationFailed: number
  failedExecution: number
  asProDebates: number
  asConDebates: number
}

function ensureMetricsEntry(
  map: Map<string, MetricsAccumulator>,
  provider: string,
  providerModelId: string,
  displayName: string
): MetricsAccumulator {
  const key = `${provider}:${providerModelId}`
  const existing = map.get(key)
  if (existing) return existing
  const entry: MetricsAccumulator = {
    providerModelId,
    provider,
    displayName,
    completedDebates: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    unknownOutcomes: 0,
    evaluationFailed: 0,
    failedExecution: 0,
    asProDebates: 0,
    asConDebates: 0,
  }
  map.set(key, entry)
  return entry
}

/**
 * Compute per-model metrics from loaded debate rows.
 *
 * Only `completed` debates contribute to wins/losses/ties. `evaluation_failed` and
 * `failed` debates are counted in their own columns so consumers can filter them out
 * of aggregate metrics while still seeing how often they occur for each model.
 */
export function buildModelMetrics(debates: any[]): ModelMetricsRow[] {
  const map = new Map<string, MetricsAccumulator>()

  for (const debate of debates) {
    if (!debate.proModel || !debate.conModel) continue

    const pro = ensureMetricsEntry(
      map,
      debate.proModel.provider,
      debate.proModel.modelId,
      debate.proModel.name
    )
    const con = ensureMetricsEntry(
      map,
      debate.conModel.provider,
      debate.conModel.modelId,
      debate.conModel.name
    )

    pro.asProDebates += 1
    con.asConDebates += 1

    if (debate.status === 'failed') {
      pro.failedExecution += 1
      con.failedExecution += 1
      continue
    }

    if (debate.status === 'evaluation_failed') {
      pro.evaluationFailed += 1
      con.evaluationFailed += 1
      continue
    }

    if (debate.status !== 'completed') continue

    pro.completedDebates += 1
    con.completedDebates += 1

    const winner = debate.aiJudgeWinner ?? debate.winner ?? null
    if (winner === 'pro') {
      pro.wins += 1
      con.losses += 1
    } else if (winner === 'con') {
      con.wins += 1
      pro.losses += 1
    } else if (winner === 'tie') {
      pro.ties += 1
      con.ties += 1
    } else {
      pro.unknownOutcomes += 1
      con.unknownOutcomes += 1
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const winRateA = a.completedDebates > 0 ? a.wins / a.completedDebates : 0
    const winRateB = b.completedDebates > 0 ? b.wins / b.completedDebates : 0
    if (winRateA !== winRateB) return winRateB - winRateA
    if (b.completedDebates !== a.completedDebates) return b.completedDebates - a.completedDebates
    return a.providerModelId.localeCompare(b.providerModelId)
  })
}

const CSV_COLUMNS: Array<keyof ModelMetricsRow> = [
  'providerModelId',
  'provider',
  'displayName',
  'completedDebates',
  'wins',
  'losses',
  'ties',
  'unknownOutcomes',
  'evaluationFailed',
  'failedExecution',
  'asProDebates',
  'asConDebates',
]

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function formatModelMetricsCsv(rows: ModelMetricsRow[]): string {
  const header = CSV_COLUMNS.join(',')
  const body = rows.map(row => CSV_COLUMNS.map(col => escapeCsvField(row[col])).join(','))
  return [header, ...body].join('\n') + '\n'
}

export function toJsonl(records: unknown[]): string {
  if (records.length === 0) return ''
  return records.map(record => JSON.stringify(record)).join('\n') + '\n'
}
