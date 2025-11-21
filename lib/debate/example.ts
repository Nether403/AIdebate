/**
 * Debate Engine Usage Examples
 * 
 * This file demonstrates how to use the Debate Engine components.
 * These examples are for documentation purposes and are not meant to be executed directly.
 */

import { createDebateEngine, createDebateConfig, createTranscriptManager } from './index'

/**
 * Example 1: Initialize and run a complete debate
 */
async function example1_CompleteDebate() {
  // Create engine instance
  const engine = createDebateEngine()

  // Build configuration
  const config = createDebateConfig()
    .withModels('model-a-uuid', 'model-b-uuid')  // Random position assignment
    .withTopic('topic-uuid')                      // Or .withRandomTopic()
    .withPersonas('persona-a-uuid', 'persona-b-uuid')
    .withRounds(3)
    .withWordLimit(500)
    .withFactCheckMode('standard')
    .build()

  // Initialize debate
  const session = await engine.initializeDebate(config)
  console.log('Debate initialized:', session.id)

  // Start debate
  await engine.startDebate(session.id)
  console.log('Debate started')

  // Simulate rounds (in real implementation, LangGraph handles this)
  for (let round = 1; round <= 3; round++) {
    console.log(`Round ${round}`)
    
    // Store turns (would be done by LangGraph agents)
    await session.transcript.storeTurn({
      roundNumber: round,
      side: 'pro',
      modelId: 'model-a-uuid',
      speech: 'Pro argument...',
      wordCount: 450,
    })

    await session.transcript.storeTurn({
      roundNumber: round,
      side: 'con',
      modelId: 'model-b-uuid',
      speech: 'Con argument...',
      wordCount: 480,
    })

    // Advance to next round (except on last round)
    if (round < 3) {
      await engine.advanceRound(session.id)
    }
  }

  // Complete debate
  await engine.completeDebate(session.id)
  console.log('Debate completed')
}

/**
 * Example 2: Recover from crash
 */
async function example2_RecoverDebate() {
  const engine = createDebateEngine()
  const debateId = 'existing-debate-uuid'

  try {
    // Attempt to recover debate
    const session = await engine.recoverDebate(debateId)
    console.log('Recovered debate at round:', session.state.currentRound)

    // Continue from where it left off
    // ...
  } catch (error) {
    console.error('Recovery failed:', error)
  }
}

/**
 * Example 3: Export transcript in multiple formats
 */
async function example3_ExportTranscript() {
  const debateId = 'completed-debate-uuid'
  const transcript = createTranscriptManager(debateId)

  // Export as JSON
  const json = await transcript.exportTranscript('json')
  console.log('JSON export:', json)

  // Export as Markdown
  const markdown = await transcript.exportTranscript('markdown')
  console.log('Markdown export:', markdown)

  // Export as plain text
  const text = await transcript.exportTranscript('text')
  console.log('Text export:', text)

  // Get statistics
  const stats = await transcript.getStatistics()
  console.log('Statistics:', {
    totalTurns: stats.totalTurns,
    averageWords: stats.averageWordsPerTurn,
    factChecksPassed: stats.totalFactChecksPassed,
    factChecksFailed: stats.totalFactChecksFailed,
  })
}

/**
 * Example 4: Configuration validation
 */
async function example4_ValidateConfiguration() {
  // Build configuration
  const builder = createDebateConfig()
    .withModels('model-a-uuid', 'model-b-uuid')
    .withTopic('topic-uuid')

  // Validate before building
  const validation = builder.validate()
  
  if (validation.valid) {
    const config = builder.build()
    console.log('Configuration is valid:', config)
  } else {
    console.error('Configuration errors:', validation.errors)
  }
}

/**
 * Example 5: Force specific model positions
 */
async function example5_ForcePositions() {
  const engine = createDebateEngine()

  // Force specific models to pro/con positions
  const config = createDebateConfig()
    .withProModel('gpt-5-uuid')      // Force GPT-5 to pro
    .withConModel('claude-4-uuid')   // Force Claude 4 to con
    .withTopic('topic-uuid')
    .build()

  const session = await engine.initializeDebate(config)
  console.log('Pro model:', session.state.proModelId)
  console.log('Con model:', session.state.conModelId)
}

/**
 * Example 6: Strict fact-checking mode
 */
async function example6_StrictFactChecking() {
  const engine = createDebateEngine()

  // Enable strict mode - turns with false claims will be rejected
  const config = createDebateConfig()
    .withModels('model-a-uuid', 'model-b-uuid')
    .withTopic('topic-uuid')
    .withFactCheckMode('strict')  // Rejects false claims
    .build()

  const session = await engine.initializeDebate(config)
  
  // In strict mode, the fact-checker will reject turns with false claims
  // and the debater will need to retry
  console.log('Fact-check mode:', session.state.factCheckMode)
}

/**
 * Example 7: Get debate state at any time
 */
async function example7_GetDebateState() {
  const engine = createDebateEngine()
  const debateId = 'existing-debate-uuid'

  const state = await engine.getDebateState(debateId)
  
  console.log('Debate state:', {
    id: state.id,
    status: state.status,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    topic: state.topicMotion,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  })
}

/**
 * Example 8: Retrieve specific turns
 */
async function example8_RetrieveTurns() {
  const debateId = 'existing-debate-uuid'
  const transcript = createTranscriptManager(debateId)

  // Get all turns
  const allTurns = await transcript.getTurns()
  console.log('Total turns:', allTurns.length)

  // Get turns for specific round
  const round1Turns = await transcript.getTurnsByRound(1)
  console.log('Round 1 turns:', round1Turns.length)

  // Get last turn for each side
  const lastProTurn = await transcript.getLastTurnBySide('pro')
  const lastConTurn = await transcript.getLastTurnBySide('con')
  console.log('Last pro speech:', lastProTurn?.speech)
  console.log('Last con speech:', lastConTurn?.speech)
}

/**
 * Example 9: Store turn with RCR phases
 */
async function example9_StoreRCRTurn() {
  const debateId = 'existing-debate-uuid'
  const transcript = createTranscriptManager(debateId)

  // Store turn with Reflect-Critique-Refine phases
  const turnId = await transcript.storeTurn({
    roundNumber: 2,
    side: 'pro',
    modelId: 'model-uuid',
    reflection: 'The opponent argues that... Their central thesis is...',
    critique: 'However, this argument contains a false dichotomy fallacy...',
    speech: 'In response to my opponent, I must point out...',
    wordCount: 475,
    factChecksPassed: 3,
    factChecksFailed: 0,
    tokensUsed: 1200,
    latencyMs: 2500,
  })

  console.log('Turn stored:', turnId)
}

/**
 * Example 10: Get full transcript with metadata
 */
async function example10_FullTranscript() {
  const debateId = 'completed-debate-uuid'
  const transcript = createTranscriptManager(debateId)

  const full = await transcript.getFullTranscript()

  console.log('Debate:', {
    id: full.debateId,
    topic: full.topic,
    pro: full.proModelName,
    con: full.conModelName,
    status: full.status,
    totalEntries: full.entries.length,
  })

  // Iterate through entries
  full.entries.forEach(entry => {
    console.log(`${entry.roundLabel} - ${entry.sideLabel}:`)
    console.log(`  Model: ${entry.modelName}`)
    if (entry.personaName) {
      console.log(`  Persona: ${entry.personaName}`)
    }
    console.log(`  Speech: ${entry.turn.speech.substring(0, 100)}...`)
    console.log(`  Words: ${entry.turn.wordCount}`)
  })
}

// Note: These examples are for documentation purposes only.
// In a real application, you would integrate these with your API routes,
// LangGraph agents, and frontend components.

export {
  example1_CompleteDebate,
  example2_RecoverDebate,
  example3_ExportTranscript,
  example4_ValidateConfiguration,
  example5_ForcePositions,
  example6_StrictFactChecking,
  example7_GetDebateState,
  example8_RetrieveTurns,
  example9_StoreRCRTurn,
  example10_FullTranscript,
}
