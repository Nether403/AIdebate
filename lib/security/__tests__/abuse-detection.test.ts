/**
 * Abuse Detection Tests
 * 
 * Tests for anomalous voting pattern detection
 * 
 * Requirements: 15
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db/client'
import { userVotes, debates, models, topics, personas } from '@/lib/db/schema'
import { analyzeVotingPattern } from '@/lib/security/abuse-detection'

describe('Abuse Detection', () => {
  let testDebateId: string
  let testModelProId: string
  let testModelConId: string

  beforeEach(async () => {
    // Create test models
    const [proModel] = await db.insert(models).values({
      name: 'Test Pro Model',
      provider: 'openai',
      modelId: 'test-pro',
    }).returning()
    
    const [conModel] = await db.insert(models).values({
      name: 'Test Con Model',
      provider: 'anthropic',
      modelId: 'test-con',
    }).returning()
    
    testModelProId = proModel.id
    testModelConId = conModel.id
    
    // Create test topic
    const [topic] = await db.insert(topics).values({
      motion: 'Test motion',
      category: 'test',
      difficulty: 'easy',
    }).returning()
    
    // Create test debate
    const [debate] = await db.insert(debates).values({
      topicId: topic.id,
      proModelId: testModelProId,
      conModelId: testModelConId,
      status: 'completed',
    }).returning()
    
    testDebateId = debate.id
  })

  describe('analyzeVotingPattern', () => {
    it('should detect rapid voting', async () => {
      const sessionId = `test-rapid-${Date.now()}`
      
      // Create 25 votes in quick succession
      const votes = []
      for (let i = 0; i < 25; i++) {
        votes.push({
          debateId: testDebateId,
          sessionId,
          vote: 'pro' as const,
          ipAddress: '192.168.1.1',
        })
      }
      
      await db.insert(userVotes).values(votes)
      
      const pattern = await analyzeVotingPattern(sessionId)
      
      expect(pattern.rapidVoting).toBe(true)
      expect(pattern.votesInLastHour).toBeGreaterThan(20)
      expect(pattern.anomalyScore).toBeGreaterThan(0)
      expect(pattern.flags).toContain(expect.stringContaining('Rapid voting'))
    })

    it('should detect provider bias', async () => {
      const sessionId = `test-bias-${Date.now()}`
      
      // Create multiple debates with same provider winning
      const debates = []
      for (let i = 0; i < 10; i++) {
        const [topic] = await db.insert(topics).values({
          motion: `Test motion ${i}`,
          category: 'test',
          difficulty: 'easy',
        }).returning()
        
        const [debate] = await db.insert(debates).values({
          topicId: topic.id,
          proModelId: testModelProId,
          conModelId: testModelConId,
          status: 'completed',
        }).returning()
        
        debates.push(debate)
      }
      
      // Vote for OpenAI (pro) in all debates
      const votes = debates.map(debate => ({
        debateId: debate.id,
        sessionId,
        vote: 'pro' as const,
        ipAddress: '192.168.1.1',
      }))
      
      await db.insert(userVotes).values(votes)
      
      const pattern = await analyzeVotingPattern(sessionId)
      
      expect(pattern.providerBias['openai']).toBeGreaterThan(0.8)
      expect(pattern.anomalyScore).toBeGreaterThan(0)
      expect(pattern.flags.some(f => f.includes('bias'))).toBe(true)
    })

    it('should detect always voting same way', async () => {
      const sessionId = `test-same-${Date.now()}`
      
      // Create multiple debates
      const debates = []
      for (let i = 0; i < 10; i++) {
        const [topic] = await db.insert(topics).values({
          motion: `Test motion ${i}`,
          category: 'test',
          difficulty: 'easy',
        }).returning()
        
        const [debate] = await db.insert(debates).values({
          topicId: topic.id,
          proModelId: testModelProId,
          conModelId: testModelConId,
          status: 'completed',
        }).returning()
        
        debates.push(debate)
      }
      
      // Always vote 'tie'
      const votes = debates.map(debate => ({
        debateId: debate.id,
        sessionId,
        vote: 'tie' as const,
        ipAddress: '192.168.1.1',
      }))
      
      await db.insert(userVotes).values(votes)
      
      const pattern = await analyzeVotingPattern(sessionId)
      
      expect(pattern.alwaysVotesSameWay).toBe(true)
      expect(pattern.anomalyScore).toBeGreaterThan(0)
      expect(pattern.flags.some(f => f.includes('Always votes'))).toBe(true)
    })

    it('should return clean pattern for normal voting', async () => {
      const sessionId = `test-normal-${Date.now()}`
      
      // Create a few debates with varied votes
      const debates = []
      for (let i = 0; i < 5; i++) {
        const [topic] = await db.insert(topics).values({
          motion: `Test motion ${i}`,
          category: 'test',
          difficulty: 'easy',
        }).returning()
        
        const [debate] = await db.insert(debates).values({
          topicId: topic.id,
          proModelId: testModelProId,
          conModelId: testModelConId,
          status: 'completed',
        }).returning()
        
        debates.push(debate)
      }
      
      // Vote with variety
      const votes = [
        { debateId: debates[0].id, sessionId, vote: 'pro' as const, ipAddress: '192.168.1.1' },
        { debateId: debates[1].id, sessionId, vote: 'con' as const, ipAddress: '192.168.1.1' },
        { debateId: debates[2].id, sessionId, vote: 'pro' as const, ipAddress: '192.168.1.1' },
        { debateId: debates[3].id, sessionId, vote: 'tie' as const, ipAddress: '192.168.1.1' },
        { debateId: debates[4].id, sessionId, vote: 'con' as const, ipAddress: '192.168.1.1' },
      ]
      
      await db.insert(userVotes).values(votes)
      
      const pattern = await analyzeVotingPattern(sessionId)
      
      expect(pattern.rapidVoting).toBe(false)
      expect(pattern.alwaysVotesSameWay).toBe(false)
      expect(pattern.anomalyScore).toBeLessThan(50)
    })
  })
})
