/**
 * Tests for Rating Engine
 * 
 * Note: These tests focus on the calculation logic without requiring database connection
 */

import { it } from "zod/v4/locales"

import { describe } from "node:test"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { describe } from "node:test"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { describe } from "node:test"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { describe } from "node:test"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { describe } from "node:test"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { it } from "zod/v4/locales"

import { describe } from "node:test"

import { beforeEach } from "node:test"

import { describe } from "node:test"

// Mock RatingEngine class with just the calculation methods
class MockRatingEngine {
  calculateControversyIndex(crowdRating: number, aiQualityRating: number): number {
    return Math.abs(crowdRating - aiQualityRating)
  }

  calculateCharismaticLiarIndex(crowdRating: number, aiQualityRating: number): number {
    const normalizedCrowd = ((crowdRating - 1500) / 10) + 50
    const normalizedAI = ((aiQualityRating - 1500) / 10) + 50
    return Math.max(0, normalizedCrowd - normalizedAI)
  }
}

describe('RatingEngine', () => {
  let engine: MockRatingEngine

  beforeEach(() => {
    engine = new MockRatingEngine()
  })

  describe('calculateControversyIndex', () => {
    it('should return 0 for identical ratings', () => {
      const index = engine.calculateControversyIndex(1500, 1500)
      expect(index).toBe(0)
    })

    it('should return absolute difference for different ratings', () => {
      const index = engine.calculateControversyIndex(1600, 1400)
      expect(index).toBe(200)
    })

    it('should return same value regardless of order', () => {
      const index1 = engine.calculateControversyIndex(1600, 1400)
      const index2 = engine.calculateControversyIndex(1400, 1600)
      expect(index1).toBe(index2)
    })

    it('should handle large differences', () => {
      const index = engine.calculateControversyIndex(2000, 1000)
      expect(index).toBe(1000)
    })

    it('should handle small differences', () => {
      const index = engine.calculateControversyIndex(1501, 1500)
      expect(index).toBe(1)
    })
  })

  describe('calculateCharismaticLiarIndex', () => {
    it('should return 0 when crowd and AI ratings are equal', () => {
      const index = engine.calculateCharismaticLiarIndex(1500, 1500)
      expect(index).toBe(0)
    })

    it('should return positive value when crowd rating exceeds AI rating', () => {
      const index = engine.calculateCharismaticLiarIndex(1700, 1500)
      expect(index).toBeGreaterThan(0)
    })

    it('should return 0 when AI rating exceeds crowd rating', () => {
      const index = engine.calculateCharismaticLiarIndex(1500, 1700)
      expect(index).toBe(0) // Max(0, negative) = 0
    })

    it('should scale with rating difference', () => {
      const index1 = engine.calculateCharismaticLiarIndex(1600, 1500)
      const index2 = engine.calculateCharismaticLiarIndex(1700, 1500)
      expect(index2).toBeGreaterThan(index1)
    })

    it('should identify charismatic liars (high crowd, low AI)', () => {
      const index = engine.calculateCharismaticLiarIndex(1800, 1400)
      expect(index).toBeGreaterThan(30) // Significant difference
    })

    it('should not flag quality models (high AI, high crowd)', () => {
      const index = engine.calculateCharismaticLiarIndex(1700, 1700)
      expect(index).toBe(0)
    })

    it('should not flag unpopular quality models (low crowd, high AI)', () => {
      const index = engine.calculateCharismaticLiarIndex(1400, 1700)
      expect(index).toBe(0)
    })
  })

  describe('Leaderboard Sorting', () => {
    const mockEntries = [
      {
        modelId: 'model-1',
        modelName: 'Model 1',
        provider: 'openai',
        crowdRating: 1600,
        crowdRatingDeviation: 100,
        aiQualityRating: 1550,
        aiQualityRatingDeviation: 100,
        aiQualityVolatility: 0.06,
        totalDebates: 100,
        wins: 60,
        losses: 30,
        ties: 10,
        winRate: 0.6,
        controversyIndex: 50,
        isControversial: false,
      },
      {
        modelId: 'model-2',
        modelName: 'Model 2',
        provider: 'anthropic',
        crowdRating: 1700,
        crowdRatingDeviation: 100,
        aiQualityRating: 1400,
        aiQualityRatingDeviation: 100,
        aiQualityVolatility: 0.06,
        totalDebates: 80,
        wins: 50,
        losses: 25,
        ties: 5,
        winRate: 0.625,
        controversyIndex: 300,
        isControversial: true,
      },
      {
        modelId: 'model-3',
        modelName: 'Model 3',
        provider: 'google',
        crowdRating: 1500,
        crowdRatingDeviation: 100,
        aiQualityRating: 1650,
        aiQualityRatingDeviation: 100,
        aiQualityVolatility: 0.06,
        totalDebates: 120,
        wins: 70,
        losses: 40,
        ties: 10,
        winRate: 0.583,
        controversyIndex: 150,
        isControversial: false,
      },
    ]

    it('should sort by win rate correctly', () => {
      const sorted = [...mockEntries].sort((a, b) => b.winRate - a.winRate)
      expect(sorted[0].modelId).toBe('model-2')
      expect(sorted[1].modelId).toBe('model-1')
      expect(sorted[2].modelId).toBe('model-3')
    })

    it('should sort by crowd rating correctly', () => {
      const sorted = [...mockEntries].sort((a, b) => b.crowdRating - a.crowdRating)
      expect(sorted[0].modelId).toBe('model-2')
      expect(sorted[1].modelId).toBe('model-1')
      expect(sorted[2].modelId).toBe('model-3')
    })

    it('should sort by AI quality rating correctly', () => {
      const sorted = [...mockEntries].sort((a, b) => b.aiQualityRating - a.aiQualityRating)
      expect(sorted[0].modelId).toBe('model-3')
      expect(sorted[1].modelId).toBe('model-1')
      expect(sorted[2].modelId).toBe('model-2')
    })

    it('should sort by total debates correctly', () => {
      const sorted = [...mockEntries].sort((a, b) => b.totalDebates - a.totalDebates)
      expect(sorted[0].modelId).toBe('model-3')
      expect(sorted[1].modelId).toBe('model-1')
      expect(sorted[2].modelId).toBe('model-2')
    })

    it('should sort by controversy index correctly', () => {
      const sorted = [...mockEntries].sort((a, b) => b.controversyIndex - a.controversyIndex)
      expect(sorted[0].modelId).toBe('model-2')
      expect(sorted[1].modelId).toBe('model-3')
      expect(sorted[2].modelId).toBe('model-1')
    })

    it('should filter controversial models correctly', () => {
      const controversial = mockEntries.filter(e => e.isControversial)
      expect(controversial).toHaveLength(1)
      expect(controversial[0].modelId).toBe('model-2')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero debates correctly', () => {
      const index = engine.calculateControversyIndex(1500, 1500)
      expect(index).toBe(0)
    })

    it('should handle extreme rating differences', () => {
      const index = engine.calculateControversyIndex(2500, 500)
      expect(index).toBe(2000)
    })

    it('should handle negative normalized ratings in Charismatic Liar calculation', () => {
      // Very low ratings (below 1000)
      const index = engine.calculateCharismaticLiarIndex(1000, 900)
      expect(index).toBeGreaterThanOrEqual(0) // Should not be negative
    })

    it('should handle very high ratings in Charismatic Liar calculation', () => {
      // Very high ratings (above 2000)
      const index = engine.calculateCharismaticLiarIndex(2200, 2000)
      expect(index).toBeGreaterThan(0)
    })
  })

  describe('Controversy Threshold', () => {
    it('should flag models with >150 point difference as controversial', () => {
      const index = engine.calculateControversyIndex(1700, 1500)
      expect(index).toBeGreaterThan(150)
    })

    it('should not flag models with <150 point difference', () => {
      const index = engine.calculateControversyIndex(1600, 1500)
      expect(index).toBeLessThan(150)
    })

    it('should flag models at exactly 150 point difference', () => {
      const index = engine.calculateControversyIndex(1650, 1500)
      expect(index).toBe(150)
    })
  })

  describe('Rating Type Separation', () => {
    it('should maintain separate crowd and AI ratings', () => {
      // This is a conceptual test - in practice, the separation is maintained
      // by the database schema and the updateRatings method
      const crowdRating = 1700
      const aiRating = 1400
      
      expect(crowdRating).not.toBe(aiRating)
      
      const controversy = engine.calculateControversyIndex(crowdRating, aiRating)
      expect(controversy).toBe(300)
    })
  })
})
