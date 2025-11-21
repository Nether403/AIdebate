/**
 * Moderator Agent
 * 
 * Enforces debate rules, announces rounds, and validates turn structure.
 * Does not use LLM - purely rule-based logic for cost efficiency.
 */

import type { DebateState } from './graph'

export interface ModeratorResult {
  announcement: string
  rulesEnforced: boolean
  validationErrors: string[]
}

/**
 * Moderator Agent Node
 * 
 * Responsibilities:
 * - Announce the current round
 * - Enforce word count limits
 * - Validate turn structure
 * - Reset turn-specific state
 */
export async function moderatorNode(state: DebateState): Promise<Partial<DebateState>> {
  console.log(`[Moderator] Starting Round ${state.currentRound}/${state.totalRounds}`)
  
  // Generate round announcement
  const announcement = generateRoundAnnouncement(state)
  
  // Validate previous turn if exists
  const validationErrors: string[] = []
  if (state.currentTurnDraft) {
    const errors = validateTurn(state.currentTurnDraft, state.wordLimitPerTurn)
    validationErrors.push(...errors)
  }
  
  // Log announcement
  console.log(`[Moderator] ${announcement}`)
  
  if (validationErrors.length > 0) {
    console.warn(`[Moderator] Validation errors:`, validationErrors)
  }
  
  // Reset turn-specific state for new round
  return {
    currentTurnDraft: null,
    currentFactCheckResults: [],
    shouldRejectTurn: false,
    retryCount: 0,
    currentSpeaker: 'pro', // Pro always speaks first in each round
    metadata: {
      ...state.metadata,
      lastModeratorAnnouncement: announcement,
      moderatorAnnouncementTime: new Date().toISOString(),
      currentRoundStarted: new Date().toISOString(),
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    },
  }
}

/**
 * Generate round announcement
 */
function generateRoundAnnouncement(state: DebateState): string {
  const roundType = getRoundType(state.currentRound, state.totalRounds)
  
  return `Round ${state.currentRound} of ${state.totalRounds}: ${roundType}. ` +
    `Topic: "${state.topicMotion}". ` +
    `Word limit: ${state.wordLimitPerTurn} words per turn. ` +
    `Fact-checking mode: ${state.factCheckMode}.`
}

/**
 * Get round type label
 */
function getRoundType(currentRound: number, totalRounds: number): string {
  if (totalRounds === 1) {
    return 'Single Round Debate'
  }
  
  if (currentRound === 1) {
    return 'Opening Statements'
  }
  
  if (currentRound === totalRounds) {
    return 'Closing Arguments'
  }
  
  return 'Rebuttals'
}

/**
 * Validate turn structure and word count
 */
function validateTurn(
  turn: { speech: string; wordCount: number; reflection?: string; critique?: string },
  wordLimit: number
): string[] {
  const errors: string[] = []
  
  // Check if speech exists
  if (!turn.speech || turn.speech.trim().length === 0) {
    errors.push('Speech is empty or missing')
  }
  
  // Check word count
  const actualWordCount = countWords(turn.speech)
  
  if (actualWordCount < 200) {
    errors.push(`Speech is too short: ${actualWordCount} words (minimum: 200)`)
  }
  
  if (actualWordCount > wordLimit) {
    errors.push(`Speech exceeds word limit: ${actualWordCount} words (maximum: ${wordLimit})`)
  }
  
  // Verify word count matches reported count
  if (Math.abs(actualWordCount - turn.wordCount) > 10) {
    errors.push(`Word count mismatch: reported ${turn.wordCount}, actual ${actualWordCount}`)
  }
  
  // Check RCR structure (optional but recommended)
  if (!turn.reflection || turn.reflection.trim().length === 0) {
    console.warn('[Moderator] Warning: Turn missing reflection phase (RCR)')
  }
  
  if (!turn.critique || turn.critique.trim().length === 0) {
    console.warn('[Moderator] Warning: Turn missing critique phase (RCR)')
  }
  
  return errors
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
}

/**
 * Enforce word count limit by truncating if necessary
 */
export function enforceWordLimit(text: string, wordLimit: number): string {
  const words = text.trim().split(/\s+/)
  
  if (words.length <= wordLimit) {
    return text
  }
  
  // Truncate to word limit
  const truncated = words.slice(0, wordLimit).join(' ')
  
  // Add ellipsis if truncated
  return truncated + '...'
}

/**
 * Validate debate configuration before starting
 */
export function validateDebateConfig(state: DebateState): string[] {
  const errors: string[] = []
  
  if (!state.debateId) {
    errors.push('Debate ID is missing')
  }
  
  if (!state.topicMotion || state.topicMotion.trim().length === 0) {
    errors.push('Topic motion is missing')
  }
  
  if (!state.proModelId) {
    errors.push('Pro model ID is missing')
  }
  
  if (!state.conModelId) {
    errors.push('Con model ID is missing')
  }
  
  if (state.proModelId === state.conModelId) {
    errors.push('Pro and Con models must be different')
  }
  
  if (state.totalRounds < 1 || state.totalRounds > 10) {
    errors.push('Total rounds must be between 1 and 10')
  }
  
  if (state.wordLimitPerTurn < 200 || state.wordLimitPerTurn > 1000) {
    errors.push('Word limit per turn must be between 200 and 1000')
  }
  
  if (!['standard', 'strict', 'off'].includes(state.factCheckMode)) {
    errors.push('Invalid fact-check mode')
  }
  
  return errors
}

