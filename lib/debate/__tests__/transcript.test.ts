import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { DebateTranscriptManager } from '../transcript'
import { db } from '@/lib/db/client'
import { models, topics, personas, debates, debateTurns } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

describe('DebateTranscriptManager', () => {
  let testDebateId: string
  let testModelId: string
  let transcriptManager: DebateTranscriptManager

  before(async () => {
    // Create test model
    const [model] = await db.insert(models).values({
      name: 'Test Model',
      provider: 'openai',
      modelId: 'test-model',
      isActive: true,
    }).returning()
    testModelId = model.id

    // Create test topic
    const [topic] = await db.insert(topics).values({
      motion: 'Test motion for transcript',
      category: 'technology',
      difficulty: 'medium',
      isActive: true,
    }).returning()

    // Create test debate
    const [debate] = await db.insert(debates).values({
      topicId: topic.id,
      proModelId: testModelId,
      conModelId: testModelId,
      status: 'in_progress',
      totalRounds: 3,
      currentRound: 1,
      factCheckMode: 'standard',
    }).returning()
    testDebateId = debate.id

    transcriptManager = new DebateTranscriptManager(testDebateId)
  })

  after(async () => {
    // Clean up test data
    await db.delete(debateTurns).where(eq(debateTurns.debateId, testDebateId))
    await db.delete(debates).where(eq(debates.id, testDebateId))
    await db.delete(models).where(eq(models.id, testModelId))
  })

  describe('storeTurn', () => {
    it('should store a debate turn', async () => {
      const turnId = await transcriptManager.storeTurn({
        roundNumber: 1,
        side: 'pro',
        modelId: testModelId,
        reflection: 'Test reflection',
        critique: 'Test critique',
        speech: 'Test speech content',
        wordCount: 50,
        factChecksPassed: 2,
        factChecksFailed: 0,
      })

      assert.ok(turnId)
    })

    it('should store turn without optional RCR fields', async () => {
      const turnId = await transcriptManager.storeTurn({
        roundNumber: 1,
        side: 'con',
        modelId: testModelId,
        speech: 'Test speech without RCR',
        wordCount: 40,
      })

      assert.ok(turnId)
    })
  })

  describe('getTurns', () => {
    it('should retrieve all turns in order', async () => {
      const turns = await transcriptManager.getTurns()

      assert.ok(turns.length > 0)
      assert.ok(turns[0].roundNumber <= turns[turns.length - 1].roundNumber)
    })
  })

  describe('getTurnsByRound', () => {
    it('should retrieve turns for specific round', async () => {
      const turns = await transcriptManager.getTurnsByRound(1)

      assert.ok(turns.length > 0)
      turns.forEach(turn => {
        assert.strictEqual(turn.roundNumber, 1)
      })
    })
  })

  describe('getLastTurnBySide', () => {
    it('should retrieve last turn for pro side', async () => {
      const lastTurn = await transcriptManager.getLastTurnBySide('pro')

      assert.ok(lastTurn)
      assert.strictEqual(lastTurn?.side, 'pro')
    })

    it('should retrieve last turn for con side', async () => {
      const lastTurn = await transcriptManager.getLastTurnBySide('con')

      assert.ok(lastTurn)
      assert.strictEqual(lastTurn?.side, 'con')
    })
  })

  describe('getFullTranscript', () => {
    it('should retrieve complete transcript with metadata', async () => {
      const transcript = await transcriptManager.getFullTranscript()

      assert.strictEqual(transcript.debateId, testDebateId)
      assert.ok(transcript.topic)
      assert.ok(transcript.proModelName)
      assert.ok(transcript.conModelName)
      assert.ok(transcript.entries)
      assert.ok(transcript.entries.length > 0)
    })

    it('should include model and persona names in entries', async () => {
      const transcript = await transcriptManager.getFullTranscript()

      transcript.entries.forEach(entry => {
        assert.ok(entry.modelName)
        assert.match(entry.roundLabel, /Round \d+/)
        assert.match(entry.sideLabel, /Pro|Con/)
      })
    })
  })

  describe('exportTranscript', () => {
    it('should export as JSON', async () => {
      const json = await transcriptManager.exportTranscript('json')

      assert.ok(json)
      const parsed = JSON.parse(json)
      assert.strictEqual(parsed.debateId, testDebateId)
      assert.ok(parsed.entries)
    })

    it('should export as Markdown', async () => {
      const markdown = await transcriptManager.exportTranscript('markdown')

      assert.ok(markdown)
      assert.match(markdown, /# Debate Transcript/)
      assert.match(markdown, /\*\*Topic:\*\*/)
      assert.match(markdown, /\*\*Pro:\*\*/)
      assert.match(markdown, /\*\*Con:\*\*/)
    })

    it('should export as plain text', async () => {
      const text = await transcriptManager.exportTranscript('text')

      assert.ok(text)
      assert.match(text, /DEBATE TRANSCRIPT/)
      assert.match(text, /Topic:/)
      assert.match(text, /Pro:/)
      assert.match(text, /Con:/)
    })
  })

  describe('getStatistics', () => {
    it('should calculate transcript statistics', async () => {
      const stats = await transcriptManager.getStatistics()

      assert.ok(stats.totalTurns > 0)
      assert.ok(stats.totalWords > 0)
      assert.ok(stats.averageWordsPerTurn > 0)
      assert.ok(stats.totalFactChecksPassed >= 0)
      assert.ok(stats.totalFactChecksFailed >= 0)
      assert.ok(stats.totalRejections >= 0)
    })
  })
})
