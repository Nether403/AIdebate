/**
 * Pure turn-length classification shared by the fact-checker gate.
 *
 * A debate turn must be neither empty/too-short (e.g. a reasoning model that
 * spent its whole token budget on hidden reasoning and emitted no speech) nor
 * over the word limit. This function centralizes that decision so it can be
 * unit-tested without the LangGraph/DB/LLM machinery.
 */

export const DEFAULT_MAX_TURN_RETRIES = 3
// ponytail: "unusable turn" floor. Catches empty/truncated speeches without
// over-rejecting models that land a little under the prompt's 200-word target.
// Upgrade path: make configurable per benchmark run.
export const MIN_SPEECH_WORDS = 50

export type TurnLengthAction =
  | { action: 'accept' }
  | { action: 'truncate' } // over the limit, retries exhausted -> truncate to limit
  | { action: 'retry'; kind: 'too_long' | 'too_short' }
  | { action: 'fail'; kind: 'too_short' } // empty/too-short, retries exhausted -> fail the debate

/**
 * Decide what to do with a freshly generated turn given its word count.
 *
 * @param wordCount      words in the candidate speech
 * @param wordLimit      configured max words per turn
 * @param nextRetryCount the retry count this turn would advance to if rejected
 *                       (i.e. state.retryCount + 1)
 */
export function classifyTurnLength(
  wordCount: number,
  wordLimit: number,
  nextRetryCount: number,
  opts: { maxRetries?: number; minWords?: number } = {}
): TurnLengthAction {
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_TURN_RETRIES
  const minWords = opts.minWords ?? MIN_SPEECH_WORDS

  if (wordCount < minWords) {
    // Cannot fabricate content: after exhausting retries, fail rather than
    // silently persist an empty/unusable turn.
    return nextRetryCount >= maxRetries ? { action: 'fail', kind: 'too_short' } : { action: 'retry', kind: 'too_short' }
  }

  if (wordCount > wordLimit) {
    // Over the limit can be salvaged by truncation once retries are exhausted.
    return nextRetryCount >= maxRetries ? { action: 'truncate' } : { action: 'retry', kind: 'too_long' }
  }

  return { action: 'accept' }
}
