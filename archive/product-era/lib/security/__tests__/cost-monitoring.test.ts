/**
 * Cost Monitoring Tests
 * 
 * Tests for spending cap enforcement and cost tracking
 * 
 * Requirements: 15
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  logCost, 
  getDailyCostSummary, 
  checkSpendingCap, 
  estimateDebateCost,
  getDailySpendingCap 
} from '@/lib/security/cost-monitoring'

describe('Cost Monitoring', () => {
  describe('getDailySpendingCap', () => {
    it('should return correct cap for development', () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('DAILY_SPENDING_CAP_DEV', '10')
      
      const cap = getDailySpendingCap()
      expect(cap).toBe(10)
    })

    it('should return correct cap for production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('DAILY_SPENDING_CAP_PROD', '500')
      
      const cap = getDailySpendingCap()
      expect(cap).toBe(500)
    })
  })

  describe('estimateDebateCost', () => {
    it('should estimate cost for basic debate', () => {
      const cost = estimateDebateCost({
        rounds: 3,
        factCheckingEnabled: false,
        judgeModel: 'gemini-3.0-pro',
      })
      
      expect(cost).toBeGreaterThan(0)
      expect(cost).toBeLessThan(1) // Should be under $1 for basic debate
    })

    it('should estimate higher cost with fact-checking', () => {
      const costWithoutFC = estimateDebateCost({
        rounds: 3,
        factCheckingEnabled: false,
        judgeModel: 'gemini-3.0-pro',
      })
      
      const costWithFC = estimateDebateCost({
        rounds: 3,
        factCheckingEnabled: true,
        judgeModel: 'gemini-3.0-pro',
      })
      
      expect(costWithFC).toBeGreaterThan(costWithoutFC)
    })

    it('should scale cost with rounds', () => {
      const cost3Rounds = estimateDebateCost({
        rounds: 3,
        factCheckingEnabled: false,
        judgeModel: 'gemini-3.0-pro',
      })
      
      const cost5Rounds = estimateDebateCost({
        rounds: 5,
        factCheckingEnabled: false,
        judgeModel: 'gemini-3.0-pro',
      })
      
      expect(cost5Rounds).toBeGreaterThan(cost3Rounds)
    })
  })

  describe('logCost and getDailyCostSummary', () => {
    it('should log and retrieve cost entries', async () => {
      const testEntry = {
        timestamp: Date.now(),
        provider: 'openai',
        model: 'gpt-5.1',
        operation: 'debate',
        inputTokens: 1000,
        outputTokens: 500,
        estimatedCost: 0.05,
      }
      
      await logCost(testEntry)
      
      const summary = await getDailyCostSummary()
      
      expect(summary.totalCost).toBeGreaterThanOrEqual(0.05)
      expect(summary.byProvider['openai']).toBeGreaterThanOrEqual(0.05)
      expect(summary.byOperation['debate']).toBeGreaterThanOrEqual(0.05)
    })

    it('should aggregate costs by provider', async () => {
      const entries = [
        {
          timestamp: Date.now(),
          provider: 'openai',
          model: 'gpt-5.1',
          operation: 'debate',
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0.05,
        },
        {
          timestamp: Date.now(),
          provider: 'google',
          model: 'gemini-3.0-pro',
          operation: 'judge',
          inputTokens: 2000,
          outputTokens: 300,
          estimatedCost: 0.03,
        },
      ]
      
      for (const entry of entries) {
        await logCost(entry)
      }
      
      const summary = await getDailyCostSummary()
      
      expect(summary.byProvider['openai']).toBeGreaterThan(0)
      expect(summary.byProvider['google']).toBeGreaterThan(0)
    })
  })

  describe('checkSpendingCap', () => {
    it('should detect when cap is exceeded', async () => {
      // Log costs that exceed the cap
      const cap = getDailySpendingCap()
      
      await logCost({
        timestamp: Date.now(),
        provider: 'openai',
        model: 'gpt-5.1',
        operation: 'debate',
        inputTokens: 100000,
        outputTokens: 50000,
        estimatedCost: cap + 1, // Exceed the cap
      })
      
      const status = await checkSpendingCap()
      
      expect(status.exceeded).toBe(true)
      expect(status.currentSpend).toBeGreaterThan(cap)
      expect(status.remainingBudget).toBe(0)
    })

    it('should show remaining budget when under cap', async () => {
      const status = await checkSpendingCap()
      
      if (!status.exceeded) {
        expect(status.remainingBudget).toBeGreaterThan(0)
        expect(status.remainingBudget).toBeLessThanOrEqual(status.cap)
      }
    })
  })
})
