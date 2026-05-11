import { JudgeParseError } from '@/lib/agents/judge'

export function buildJudgeFailureEvaluationValues(params: {
  debateId: string
  judgeProvider: string | null
  judgeModel: string | null
  promptVersion: string | null
  error: unknown
}) {
  const parseError = params.error instanceof JudgeParseError ? params.error : null
  const errorMessage = params.error instanceof Error ? params.error.message : String(params.error)

  return {
    debateId: params.debateId,
    judgeProvider: params.judgeProvider || 'unknown',
    judgeModel: params.judgeModel || process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'unknown',
    evaluationOrder: parseError ? parseError.evaluationOrder : 'consensus',
    winner: null,
    proScore: null,
    conScore: null,
    reasoning: errorMessage,
    rubricScores: {},
    positionBiasDetected: false,
    parseStatus: parseError ? 'parse_failed' : 'error',
    rawResponse: parseError ? parseError.rawResponse : null,
    errorMessage,
    promptVersion: params.promptVersion,
    schemaVersion: 'judge-v1',
    consensus: null,
    tiebreakerUsed: null,
  }
}

export function buildJudgeFailureErrorState(error: unknown) {
  const isParseError = error instanceof JudgeParseError

  return {
    stage: 'judge',
    parseStatus: isParseError ? 'parse_failed' : 'error',
    message: error instanceof Error ? error.message : String(error),
  }
}
