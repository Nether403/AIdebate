import { db } from '@/lib/db/client'
import { debates, topics, models, personas } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import type { DebateConfig } from './config'
import { DebateTranscriptManager } from './transcript'
import type { DebateStatus, DebateSide } from '@/types'

/**
 * Debate State - Current state of an active debate
 */
export interface DebateState {
  id: string
  status: DebateStatus
  currentRound: number
  totalRounds: number
  topicId: string
  topicMotion: string
  proModelId: string
  conModelId: string
  proPersonaId: string | null
  conPersonaId: string | null
  factCheckMode: string
  wordLimitPerTurn: number
  startedAt: Date | null
  completedAt: Date | null
  lastCheckpoint: Date
}

/**
 * Debate Checkpoint - Serializable state for recovery
 */
export interface DebateCheckpoint {
  debateId: string
  state: DebateState
  lastTurnId: string | null
  timestamp: Date
}

/**
 * Debate Session - Active debate with transcript manager
 */
export interface DebateSession {
  id: string
  state: DebateState
  transcript: DebateTranscriptManager
}

/**
 * Debate Engine
 * Core orchestrator for debate lifecycle management
 */
export class DebateEngine {
  /**
   * Initialize a new debate from configuration
   */
  async initializeDebate(config: DebateConfig): Promise<DebateSession> {
    // Select topic
    const topicId = await this.selectTopic(config)
    
    // Validate models exist and are active
    await this.validateModels(config.proModelId, config.conModelId)
    
    // Validate personas if specified
    if (config.proPersonaId) {
      await this.validatePersona(config.proPersonaId)
    }
    if (config.conPersonaId) {
      await this.validatePersona(config.conPersonaId)
    }

    // Create debate record
    const [debate] = await db.insert(debates).values({
      topicId,
      proModelId: config.proModelId,
      conModelId: config.conModelId,
      proPersonaId: config.proPersonaId || null,
      conPersonaId: config.conPersonaId || null,
      status: 'pending',
      totalRounds: config.totalRounds,
      currentRound: 0,
      factCheckMode: config.factCheckMode,
      startedAt: null,
      completedAt: null,
    }).returning()

    // Increment topic usage count
    await db.update(topics)
      .set({ usageCount: sql`${topics.usageCount} + 1` })
      .where(eq(topics.id, topicId))

    // Increment persona usage counts if applicable
    if (config.proPersonaId) {
      await db.update(personas)
        .set({ usageCount: sql`${personas.usageCount} + 1` })
        .where(eq(personas.id, config.proPersonaId))
    }
    if (config.conPersonaId) {
      await db.update(personas)
        .set({ usageCount: sql`${personas.usageCount} + 1` })
        .where(eq(personas.id, config.conPersonaId))
    }

    // Create checkpoint
    await this.createCheckpoint(debate.id)

    // Build state
    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
    })

    const state: DebateState = {
      id: debate.id,
      status: debate.status as DebateStatus,
      currentRound: debate.currentRound,
      totalRounds: debate.totalRounds,
      topicId: debate.topicId,
      topicMotion: topic!.motion,
      proModelId: debate.proModelId,
      conModelId: debate.conModelId,
      proPersonaId: debate.proPersonaId,
      conPersonaId: debate.conPersonaId,
      factCheckMode: debate.factCheckMode,
      wordLimitPerTurn: config.wordLimitPerTurn,
      startedAt: debate.startedAt,
      completedAt: debate.completedAt,
      lastCheckpoint: new Date(),
    }

    return {
      id: debate.id,
      state,
      transcript: new DebateTranscriptManager(debate.id),
    }
  }

  /**
   * Start a debate (transition from pending to in_progress)
   */
  async startDebate(debateId: string): Promise<void> {
    await db.update(debates)
      .set({
        status: 'in_progress',
        startedAt: new Date(),
        currentRound: 1,
      })
      .where(eq(debates.id, debateId))

    await this.createCheckpoint(debateId)
  }

  /**
   * Advance to the next round
   */
  async advanceRound(debateId: string): Promise<number> {
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
    })

    if (!debate) {
      throw new Error(`Debate ${debateId} not found`)
    }

    const nextRound = debate.currentRound + 1

    if (nextRound > debate.totalRounds) {
      throw new Error(`Cannot advance beyond round ${debate.totalRounds}`)
    }

    await db.update(debates)
      .set({ currentRound: nextRound })
      .where(eq(debates.id, debateId))

    await this.createCheckpoint(debateId)

    return nextRound
  }

  /**
   * Complete a debate
   */
  async completeDebate(debateId: string): Promise<void> {
    await db.update(debates)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(debates.id, debateId))

    await this.createCheckpoint(debateId)
  }

  /**
   * Mark a debate as failed
   */
  async failDebate(debateId: string, reason?: string): Promise<void> {
    await db.update(debates)
      .set({
        status: 'failed',
        completedAt: new Date(),
      })
      .where(eq(debates.id, debateId))

    // Log failure reason if provided
    console.error(`Debate ${debateId} failed: ${reason || 'Unknown reason'}`)
  }

  /**
   * Get current debate state
   */
  async getDebateState(debateId: string): Promise<DebateState> {
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        topic: true,
      },
    })

    if (!debate) {
      throw new Error(`Debate ${debateId} not found`)
    }

    return {
      id: debate.id,
      status: debate.status as DebateStatus,
      currentRound: debate.currentRound,
      totalRounds: debate.totalRounds,
      topicId: debate.topicId,
      topicMotion: debate.topic.motion,
      proModelId: debate.proModelId,
      conModelId: debate.conModelId,
      proPersonaId: debate.proPersonaId,
      conPersonaId: debate.conPersonaId,
      factCheckMode: debate.factCheckMode,
      wordLimitPerTurn: 500, // Default, should be stored in debate config
      startedAt: debate.startedAt,
      completedAt: debate.completedAt,
      lastCheckpoint: new Date(),
    }
  }

  /**
   * Load a debate session for resumption
   */
  async loadDebateSession(debateId: string): Promise<DebateSession> {
    const state = await this.getDebateState(debateId)
    
    return {
      id: debateId,
      state,
      transcript: new DebateTranscriptManager(debateId),
    }
  }

  /**
   * Recover a debate from the last checkpoint
   */
  async recoverDebate(debateId: string): Promise<DebateSession> {
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
    })

    if (!debate) {
      throw new Error(`Debate ${debateId} not found`)
    }

    // Check if debate is in a recoverable state
    if (debate.status === 'completed') {
      throw new Error(`Debate ${debateId} is already completed`)
    }

    if (debate.status === 'pending') {
      throw new Error(`Debate ${debateId} has not started yet`)
    }

    // Load the session
    const session = await this.loadDebateSession(debateId)

    console.log(`Recovered debate ${debateId} from checkpoint at round ${session.state.currentRound}`)

    return session
  }

  /**
   * Create a checkpoint for the debate state
   */
  private async createCheckpoint(debateId: string): Promise<void> {
    // In a production system, this would store checkpoint data
    // For now, we rely on the database state itself as the checkpoint
    // Future enhancement: Store in a separate checkpoints table with full state snapshot
    
    // Update the debate's updatedAt timestamp to mark checkpoint
    await db.update(debates)
      .set({ 
        // Drizzle will automatically update any timestamp fields on update
      })
      .where(eq(debates.id, debateId))
  }

  /**
   * Select a topic based on configuration
   */
  private async selectTopic(config: DebateConfig): Promise<string> {
    if (config.topicSelection === 'manual' && config.topicId) {
      // Validate the specified topic exists and is active
      const topic = await db.query.topics.findFirst({
        where: and(
          eq(topics.id, config.topicId),
          eq(topics.isActive, true)
        ),
      })

      if (!topic) {
        throw new Error(`Topic ${config.topicId} not found or inactive`)
      }

      return config.topicId
    }

    // Random selection
    const activeTopics = await db.query.topics.findMany({
      where: eq(topics.isActive, true),
    })

    if (activeTopics.length === 0) {
      throw new Error('No active topics available')
    }

    // Select random topic
    const randomIndex = Math.floor(Math.random() * activeTopics.length)
    return activeTopics[randomIndex].id
  }

  /**
   * Validate that models exist and are active
   */
  private async validateModels(proModelId: string, conModelId: string): Promise<void> {
    const proModel = await db.query.models.findFirst({
      where: eq(models.id, proModelId),
    })

    if (!proModel) {
      throw new Error(`Pro model ${proModelId} not found`)
    }

    if (!proModel.isActive) {
      throw new Error(`Pro model ${proModel.name} is not active`)
    }

    const conModel = await db.query.models.findFirst({
      where: eq(models.id, conModelId),
    })

    if (!conModel) {
      throw new Error(`Con model ${conModelId} not found`)
    }

    if (!conModel.isActive) {
      throw new Error(`Con model ${conModel.name} is not active`)
    }

    // Ensure models are different
    if (proModelId === conModelId) {
      throw new Error('Pro and Con models must be different')
    }
  }

  /**
   * Validate that a persona exists and is active
   */
  private async validatePersona(personaId: string): Promise<void> {
    const persona = await db.query.personas.findFirst({
      where: eq(personas.id, personaId),
    })

    if (!persona) {
      throw new Error(`Persona ${personaId} not found`)
    }

    if (!persona.isActive) {
      throw new Error(`Persona ${persona.name} is not active`)
    }
  }
}

/**
 * Create a new debate engine instance
 */
export function createDebateEngine(): DebateEngine {
  return new DebateEngine()
}
