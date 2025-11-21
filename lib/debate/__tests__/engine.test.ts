import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { DebateEngine } from '../engine'
import { createDebateConfig } from '../config'
import { db } from '@/lib/db/client'
import { models, topics, personas, debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

describe('DebateEngine', () => {
  let engine: DebateEngine
  let testModelAId: string
  let testModelBId: string
  let testTopicId: string
  let testPersonaId: string

  before(async () => {
    engine = new DebateEngine()

    // Create test models
    const [modelA] = await db.insert(models).values({
      name: 'Test Model A',
      provider: 'openai',
      modelId: 'test-model-a',
      isActive: true,
    }).returning()
    testModelAId = modelA.id

    const [modelB] = await db.insert(models).values({
      name: 'Test Model B',
      provider: 'anthropic',
      modelId: 'test-model-b',
      isActive: true,
    }).returning()
    testModelBId = modelB.id

    // Create test topic
    const [topic] = await db.insert(topics).values({
      motion: 'Test motion: AI will benefit humanity',
      category: 'technology',
      difficulty: 'medium',
      isActive: true,
    }).returning()
    testTopicId = topic.id

    // Create test persona
    const [persona] = await db.insert(personas).values({
      name: 'Test Persona',
      description: 'A test persona for unit tests',
      systemPrompt: 'You are a test persona.',
      isActive: true,
    }).returning()
    testPersonaId = persona.id
  })

  after(async () => {
    // Clean up test data
    await db.delete(debates).where(eq(debates.proModelId, testModelAId))
    await db.delete(models).where(eq(models.id, testModelAId))
    await db.delete(models).where(eq(models.id, testModelBId))
    await db.delete(topics).where(eq(topics.id, testTopicId))
    await db.delete(personas).where(eq(personas.id, testPersonaId))
  })

  describe('initializeDebate', () => {
    it('should create a new debate with valid configuration', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .withRounds(3)
        .withWordLimit(500)
        .withFactCheckMode('standard')
        .build()

      const session = await engine.initializeDebate(config)

      assert.ok(session.id)
      assert.strictEqual(session.state.status, 'pending')
      assert.strictEqual(session.state.currentRound, 0)
      assert.strictEqual(session.state.totalRounds, 3)
      assert.strictEqual(session.state.topicId, testTopicId)
      assert.ok(session.transcript)
    })

    it('should assign personas when specified', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .withPersonas(testPersonaId, testPersonaId)
        .build()

      const session = await engine.initializeDebate(config)

      assert.strictEqual(session.state.proPersonaId, testPersonaId)
      assert.strictEqual(session.state.conPersonaId, testPersonaId)
    })

    it('should select random topic when not specified', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withRandomTopic()
        .build()

      const session = await engine.initializeDebate(config)

      assert.ok(session.state.topicId)
    })

    it('should throw error for invalid model', async () => {
      const config = createDebateConfig()
        .withModels('invalid-id', testModelBId)
        .withTopic(testTopicId)
        .build()

      await assert.rejects(engine.initializeDebate(config))
    })
  })

  describe('startDebate', () => {
    it('should transition debate from pending to in_progress', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .build()

      const session = await engine.initializeDebate(config)
      await engine.startDebate(session.id)

      const state = await engine.getDebateState(session.id)
      assert.strictEqual(state.status, 'in_progress')
      assert.strictEqual(state.currentRound, 1)
      assert.ok(state.startedAt)
    })
  })

  describe('advanceRound', () => {
    it('should increment the current round', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .withRounds(3)
        .build()

      const session = await engine.initializeDebate(config)
      await engine.startDebate(session.id)

      const nextRound = await engine.advanceRound(session.id)
      assert.strictEqual(nextRound, 2)

      const state = await engine.getDebateState(session.id)
      assert.strictEqual(state.currentRound, 2)
    })

    it('should throw error when advancing beyond total rounds', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .withRounds(2)
        .build()

      const session = await engine.initializeDebate(config)
      await engine.startDebate(session.id)
      await engine.advanceRound(session.id)

      await assert.rejects(engine.advanceRound(session.id))
    })
  })

  describe('completeDebate', () => {
    it('should mark debate as completed', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .build()

      const session = await engine.initializeDebate(config)
      await engine.startDebate(session.id)
      await engine.completeDebate(session.id)

      const state = await engine.getDebateState(session.id)
      assert.strictEqual(state.status, 'completed')
      assert.ok(state.completedAt)
    })
  })

  describe('recoverDebate', () => {
    it('should recover an in-progress debate', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .build()

      const session = await engine.initializeDebate(config)
      await engine.startDebate(session.id)

      const recovered = await engine.recoverDebate(session.id)
      assert.strictEqual(recovered.id, session.id)
      assert.strictEqual(recovered.state.status, 'in_progress')
      assert.strictEqual(recovered.state.currentRound, 1)
    })

    it('should throw error when recovering completed debate', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .build()

      const session = await engine.initializeDebate(config)
      await engine.startDebate(session.id)
      await engine.completeDebate(session.id)

      await assert.rejects(
        engine.recoverDebate(session.id),
        /already completed/
      )
    })

    it('should throw error when recovering pending debate', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .build()

      const session = await engine.initializeDebate(config)

      await assert.rejects(
        engine.recoverDebate(session.id),
        /has not started/
      )
    })
  })

  describe('getDebateState', () => {
    it('should return current debate state', async () => {
      const config = createDebateConfig()
        .withModels(testModelAId, testModelBId)
        .withTopic(testTopicId)
        .withRounds(5)
        .build()

      const session = await engine.initializeDebate(config)
      const state = await engine.getDebateState(session.id)

      assert.strictEqual(state.id, session.id)
      assert.strictEqual(state.status, 'pending')
      assert.strictEqual(state.totalRounds, 5)
      assert.ok(state.topicMotion)
    })
  })
})
