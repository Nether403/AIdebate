/**
 * Example: Using the LangGraph Multi-Agent Debate System
 * 
 * This file demonstrates how to use the debate orchestration system.
 */

import { runDebate, initializeDebateState, validateDebateConfig } from './index'
import { createDebateEngine } from '@/lib/debate/engine'
import type { DebateConfig } from '@/lib/debate/config'

/**
 * Example 1: Run a complete 3-round debate
 */
async function example1_runCompleteDebate() {
  console.log('=== Example 1: Run Complete Debate ===\n')
  
  // First, create a debate using the debate engine
  const engine = createDebateEngine()
  
  const config: DebateConfig = {
    proModelId: 'model-gpt-5.1',
    conModelId: 'model-claude-4.5',
    topicSelection: 'random',
    totalRounds: 3,
    wordLimitPerTurn: 500,
    factCheckMode: 'standard',
  }
  
  const session = await engine.initializeDebate(config)
  await engine.startDebate(session.id)
  
  console.log(`Debate initialized: ${session.id}`)
  console.log(`Topic: ${session.state.topicMotion}`)
  console.log(`Pro Model: ${session.state.proModelId}`)
  console.log(`Con Model: ${session.state.conModelId}`)
  console.log()
  
  // Run the debate using LangGraph
  const finalState = await runDebate(session.id, config)
  
  console.log('Debate completed!')
  console.log(`Total rounds: ${finalState.currentRound}`)
  console.log(`Total turns: ${finalState.transcript.length}`)
  console.log(`Fact-checks performed: ${finalState.factCheckLogs.length}`)
  console.log()
}

/**
 * Example 2: Run a debate with strict fact-checking
 */
async function example2_strictFactChecking() {
  console.log('=== Example 2: Strict Fact-Checking Mode ===\n')
  
  const engine = createDebateEngine()
  
  const config: DebateConfig = {
    proModelId: 'model-gpt-5.1',
    conModelId: 'model-gemini-3.0',
    topicSelection: 'random',
    totalRounds: 2,
    wordLimitPerTurn: 400,
    factCheckMode: 'strict', // Reject turns with false claims
  }
  
  const session = await engine.initializeDebate(config)
  await engine.startDebate(session.id)
  
  console.log('Running debate with STRICT fact-checking...')
  console.log('False claims will cause turn rejection and retry')
  console.log()
  
  const finalState = await runDebate(session.id, config)
  
  // Check for rejected turns
  const rejectedTurns = finalState.transcript.filter(t => t.wasRejected)
  console.log(`Rejected turns: ${rejectedTurns.length}`)
  
  // Calculate factuality scores
  const proTurns = finalState.transcript.filter(t => t.side === 'pro')
  const conTurns = finalState.transcript.filter(t => t.side === 'con')
  
  const proFactuality = proTurns.reduce((sum, t) => 
    sum + (t.factChecksPassed / (t.factChecksPassed + t.factChecksFailed || 1)), 0
  ) / proTurns.length
  
  const conFactuality = conTurns.reduce((sum, t) => 
    sum + (t.factChecksPassed / (t.factChecksPassed + t.factChecksFailed || 1)), 0
  ) / conTurns.length
  
  console.log(`Pro factuality score: ${(proFactuality * 100).toFixed(1)}%`)
  console.log(`Con factuality score: ${(conFactuality * 100).toFixed(1)}%`)
  console.log()
}

/**
 * Example 3: Run a debate with personas
 */
async function example3_personaDrivenDebate() {
  console.log('=== Example 3: Persona-Driven Debate ===\n')
  
  const engine = createDebateEngine()
  
  const config: DebateConfig = {
    proModelId: 'model-gpt-5.1',
    conModelId: 'model-claude-4.5',
    proPersonaId: 'persona-socrates', // Philosophical, questioning style
    conPersonaId: 'persona-churchill', // Rhetorical, persuasive style
    topicSelection: 'manual',
    topicId: 'topic-democracy-vs-technocracy',
    totalRounds: 3,
    wordLimitPerTurn: 500,
    factCheckMode: 'standard',
  }
  
  const session = await engine.initializeDebate(config)
  await engine.startDebate(session.id)
  
  console.log('Running persona-driven debate...')
  console.log(`Pro Persona: ${session.state.proPersonaId}`)
  console.log(`Con Persona: ${session.state.conPersonaId}`)
  console.log()
  
  const finalState = await runDebate(session.id, config)
  
  // Display sample turns
  console.log('Sample turns:')
  finalState.transcript.slice(0, 2).forEach(turn => {
    console.log(`\n[Round ${turn.roundNumber} - ${turn.side.toUpperCase()}]`)
    console.log(`Reflection: ${turn.reflection?.substring(0, 100)}...`)
    console.log(`Critique: ${turn.critique?.substring(0, 100)}...`)
    console.log(`Speech: ${turn.speech.substring(0, 200)}...`)
  })
  console.log()
}

/**
 * Example 4: Validate debate configuration
 */
async function example4_validateConfiguration() {
  console.log('=== Example 4: Configuration Validation ===\n')
  
  // Create a mock state for validation
  const mockState = {
    debateId: 'test-debate',
    topicMotion: 'AI will benefit humanity',
    proModelId: 'model-a',
    conModelId: 'model-a', // INVALID: Same model
    proPersonaId: null,
    conPersonaId: null,
    currentRound: 1,
    totalRounds: 0, // INVALID: Must be >= 1
    currentSpeaker: 'pro' as const,
    wordLimitPerTurn: 50, // INVALID: Must be >= 200
    factCheckMode: 'invalid' as any, // INVALID: Not a valid mode
    transcript: [],
    factCheckLogs: [],
    proScratchpad: '',
    conScratchpad: '',
    currentTurnDraft: null,
    currentFactCheckResults: [],
    shouldRejectTurn: false,
    retryCount: 0,
    isDebateComplete: false,
    metadata: {},
  }
  
  const errors = validateDebateConfig(mockState)
  
  console.log('Validation errors found:')
  errors.forEach((error, i) => {
    console.log(`${i + 1}. ${error}`)
  })
  console.log()
}

/**
 * Example 5: Monitor debate progress
 */
async function example5_monitorProgress() {
  console.log('=== Example 5: Monitor Debate Progress ===\n')
  
  const engine = createDebateEngine()
  
  const config: DebateConfig = {
    proModelId: 'model-gpt-5.1',
    conModelId: 'model-gemini-3.0',
    topicSelection: 'random',
    totalRounds: 2,
    wordLimitPerTurn: 400,
    factCheckMode: 'standard',
  }
  
  const session = await engine.initializeDebate(config)
  await engine.startDebate(session.id)
  
  console.log('Starting debate with progress monitoring...')
  console.log()
  
  // Initialize state
  const initialState = await initializeDebateState(session.id, config)
  
  console.log('Initial state:')
  console.log(`- Round: ${initialState.currentRound}/${initialState.totalRounds}`)
  console.log(`- Speaker: ${initialState.currentSpeaker}`)
  console.log(`- Transcript length: ${initialState.transcript.length}`)
  console.log()
  
  // Run debate
  const finalState = await runDebate(session.id, config)
  
  console.log('Final state:')
  console.log(`- Round: ${finalState.currentRound}/${finalState.totalRounds}`)
  console.log(`- Transcript length: ${finalState.transcript.length}`)
  console.log(`- Debate complete: ${finalState.isDebateComplete}`)
  console.log()
  
  // Calculate statistics
  const stats = {
    totalWords: finalState.transcript.reduce((sum, t) => sum + t.wordCount, 0),
    avgWordsPerTurn: finalState.transcript.reduce((sum, t) => sum + t.wordCount, 0) / finalState.transcript.length,
    totalFactChecks: finalState.transcript.reduce((sum, t) => sum + t.factChecksPassed + t.factChecksFailed, 0),
    factCheckAccuracy: finalState.transcript.reduce((sum, t) => sum + t.factChecksPassed, 0) / 
      finalState.transcript.reduce((sum, t) => sum + t.factChecksPassed + t.factChecksFailed, 0),
  }
  
  console.log('Debate statistics:')
  console.log(`- Total words: ${stats.totalWords}`)
  console.log(`- Avg words per turn: ${stats.avgWordsPerTurn.toFixed(0)}`)
  console.log(`- Total fact-checks: ${stats.totalFactChecks}`)
  console.log(`- Fact-check accuracy: ${(stats.factCheckAccuracy * 100).toFixed(1)}%`)
  console.log()
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('='.repeat(60))
  console.log('LangGraph Multi-Agent Debate System Examples')
  console.log('='.repeat(60))
  console.log()
  
  // Note: These examples require a database connection and API keys
  // Uncomment to run specific examples:
  
  // await example1_runCompleteDebate()
  // await example2_strictFactChecking()
  // await example3_personaDrivenDebate()
  await example4_validateConfiguration()
  // await example5_monitorProgress()
  
  console.log('='.repeat(60))
  console.log('Examples Complete')
  console.log('='.repeat(60))
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error)
}

export {
  example1_runCompleteDebate,
  example2_strictFactChecking,
  example3_personaDrivenDebate,
  example4_validateConfiguration,
  example5_monitorProgress,
}

