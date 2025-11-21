/**
 * Rating Engine for AI Debate Arena
 * 
 * Manages dual scoring system:
 * - Crowd Score: Based on user votes
 * - AI Quality Score: Based on AI judge evaluations using Glicko-2
 * 
 * Requirements: 6, 8
 */

import { db } from '@/lib/db/client'
import { models, debates, modelRatings } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { updateRating, initializeRating, type Glicko2Rating, type MatchResult } from './glicko2'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export type RatingType = 'crowd' | 'ai_quality'

export interface DebateResult {
  debateId: string
  modelAId: string
  modelBId: string
  winner: 'pro' | 'con' | 'tie'
  resultType: RatingType
  timestamp: Date
}

export interface LeaderboardEntry {
  modelId: string
  modelName: string
  provider: string
  crowdRating: number
  crowdRatingDeviation: number
  aiQualityRating: number
  aiQualityRatingDeviation: number
  aiQualityVolatility: number
  totalDebates: number
  wins: number
  losses: number
  ties: number
  winRate: number
  controversyIndex: number
  isControversial: boolean
}

export type LeaderboardSort = 
  | 'win_rate' 
  | 'crowd_rating' 
  | 'ai_quality_rating' 
  | 'total_debates'
  | 'controversy_index'

/**
 * Rating Engine class
 */
export class RatingEngine {
  /**
   * Initialize rating for a new model
   */
  async initializeModelRating(modelId: string): Promise<void> {
    const initialRating = initializeRating()
    
    await db.update(models)
      .set({
        crowdRating: initialRating.rating,
        crowdRatingDeviation: initialRating.ratingDeviation,
        aiQualityRating: initialRating.rating,
        aiQualityRatingDeviation: initialRating.ratingDeviation,
        aiQualityVolatility: initialRating.volatility,
        updatedAt: new Date(),
      })
      .where(eq(models.id, modelId))
    
    // Record initial rating in history
    await db.insert(modelRatings).values([
      {
        modelId,
        ratingType: 'crowd',
        rating: initialRating.rating,
        ratingDeviation: initialRating.ratingDeviation,
        volatility: null,
        debatesCount: 0,
      },
      {
        modelId,
        ratingType: 'ai_quality',
        rating: initialRating.rating,
        ratingDeviation: initialRating.ratingDeviation,
        volatility: initialRating.volatility,
        debatesCount: 0,
      },
    ])
  }

  /**
   * Get current rating for a model
   */
  async getRating(modelId: string, ratingType: RatingType): Promise<Glicko2Rating> {
    const model = await db.query.models.findFirst({
      where: eq(models.id, modelId),
    })
    
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }
    
    if (ratingType === 'crowd') {
      return {
        rating: model.crowdRating,
        ratingDeviation: model.crowdRatingDeviation,
        volatility: 0.06, // Crowd ratings don't use volatility
      }
    } else {
      return {
        rating: model.aiQualityRating,
        ratingDeviation: model.aiQualityRatingDeviation,
        volatility: model.aiQualityVolatility,
      }
    }
  }

  /**
   * Update ratings based on debate results
   * This should be called in batch mode every 24 hours
   */
  async updateRatings(results: DebateResult[]): Promise<void> {
    if (results.length === 0) return
    
    // Group results by model and rating type
    const modelResults = new Map<string, Map<RatingType, MatchResult[]>>()
    
    for (const result of results) {
      // Get debate details to determine positions
      const debate = await db.query.debates.findFirst({
        where: eq(debates.id, result.debateId),
      })
      
      if (!debate) continue
      
      const proModelId = debate.proModelId
      const conModelId = debate.conModelId
      
      // Determine scores based on winner
      let proScore: number
      let conScore: number
      
      if (result.winner === 'pro') {
        proScore = 1
        conScore = 0
      } else if (result.winner === 'con') {
        proScore = 0
        conScore = 1
      } else {
        proScore = 0.5
        conScore = 0.5
      }
      
      // Get opponent ratings
      const proRating = await this.getRating(proModelId, result.resultType)
      const conRating = await this.getRating(conModelId, result.resultType)
      
      // Add results for pro model
      if (!modelResults.has(proModelId)) {
        modelResults.set(proModelId, new Map())
      }
      const proMap = modelResults.get(proModelId)!
      if (!proMap.has(result.resultType)) {
        proMap.set(result.resultType, [])
      }
      proMap.get(result.resultType)!.push({
        opponentRating: conRating.rating,
        opponentRatingDeviation: conRating.ratingDeviation,
        score: proScore,
      })
      
      // Add results for con model
      if (!modelResults.has(conModelId)) {
        modelResults.set(conModelId, new Map())
      }
      const conMap = modelResults.get(conModelId)!
      if (!conMap.has(result.resultType)) {
        conMap.set(result.resultType, [])
      }
      conMap.get(result.resultType)!.push({
        opponentRating: proRating.rating,
        opponentRatingDeviation: proRating.ratingDeviation,
        score: conScore,
      })
    }
    
    // Update each model's ratings
    for (const [modelId, ratingTypeMap] of modelResults) {
      for (const [ratingType, matches] of ratingTypeMap) {
        const currentRating = await this.getRating(modelId, ratingType)
        const newRating = updateRating(currentRating, matches)
        
        // Update model table
        if (ratingType === 'crowd') {
          await db.update(models)
            .set({
              crowdRating: newRating.rating,
              crowdRatingDeviation: newRating.ratingDeviation,
              updatedAt: new Date(),
            })
            .where(eq(models.id, modelId))
        } else {
          await db.update(models)
            .set({
              aiQualityRating: newRating.rating,
              aiQualityRatingDeviation: newRating.ratingDeviation,
              aiQualityVolatility: newRating.volatility,
              updatedAt: new Date(),
            })
            .where(eq(models.id, modelId))
        }
        
        // Record in rating history
        const model = await db.query.models.findFirst({
          where: eq(models.id, modelId),
        })
        
        await db.insert(modelRatings).values({
          modelId,
          ratingType,
          rating: newRating.rating,
          ratingDeviation: newRating.ratingDeviation,
          volatility: ratingType === 'ai_quality' ? newRating.volatility : null,
          debatesCount: model?.totalDebates || 0,
        })
      }
    }
    
    // Invalidate leaderboard cache
    await redis.del('leaderboard:all')
    await redis.del('leaderboard:controversial')
  }

  /**
   * Calculate controversy index for a model
   * Controversy = |Crowd Rating - AI Quality Rating|
   */
  calculateControversyIndex(crowdRating: number, aiQualityRating: number): number {
    return Math.abs(crowdRating - aiQualityRating)
  }

  /**
   * Calculate Charismatic Liar Index
   * High crowd score + Low AI quality score = Charismatic Liar
   */
  calculateCharismaticLiarIndex(crowdRating: number, aiQualityRating: number): number {
    // Normalize ratings to 0-100 scale (assuming 1500 is average)
    const normalizedCrowd = ((crowdRating - 1500) / 10) + 50
    const normalizedAI = ((aiQualityRating - 1500) / 10) + 50
    
    // Charismatic Liar = High crowd appeal - Low AI quality
    return Math.max(0, normalizedCrowd - normalizedAI)
  }

  /**
   * Get leaderboard with sorting and filtering
   */
  async getLeaderboard(
    sortBy: LeaderboardSort = 'win_rate',
    filterControversial: boolean = false,
    topicCategory?: string
  ): Promise<LeaderboardEntry[]> {
    // Try to get from cache
    const cacheKey = `leaderboard:${sortBy}:${filterControversial}:${topicCategory || 'all'}`
    const cached = await redis.get<LeaderboardEntry[]>(cacheKey)
    
    if (cached) {
      return cached
    }
    
    // Query all active models
    const allModels = await db.query.models.findMany({
      where: eq(models.isActive, true),
    })
    
    // Build leaderboard entries
    const entries: LeaderboardEntry[] = allModels.map(model => {
      const winRate = model.totalDebates > 0 
        ? model.wins / model.totalDebates 
        : 0
      
      const controversyIndex = this.calculateControversyIndex(
        model.crowdRating,
        model.aiQualityRating
      )
      
      const isControversial = controversyIndex > 150 // 15 point difference threshold
      
      return {
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        crowdRating: model.crowdRating,
        crowdRatingDeviation: model.crowdRatingDeviation,
        aiQualityRating: model.aiQualityRating,
        aiQualityRatingDeviation: model.aiQualityRatingDeviation,
        aiQualityVolatility: model.aiQualityVolatility,
        totalDebates: model.totalDebates,
        wins: model.wins,
        losses: model.losses,
        ties: model.ties,
        winRate,
        controversyIndex,
        isControversial,
      }
    })
    
    // Filter controversial if requested
    let filtered = filterControversial 
      ? entries.filter(e => e.isControversial)
      : entries
    
    // Sort based on criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'win_rate':
          return b.winRate - a.winRate
        case 'crowd_rating':
          return b.crowdRating - a.crowdRating
        case 'ai_quality_rating':
          return b.aiQualityRating - a.aiQualityRating
        case 'total_debates':
          return b.totalDebates - a.totalDebates
        case 'controversy_index':
          return b.controversyIndex - a.controversyIndex
        default:
          return b.winRate - a.winRate
      }
    })
    
    // Cache for 1 hour
    await redis.set(cacheKey, filtered, { ex: 3600 })
    
    return filtered
  }

  /**
   * Get model statistics
   */
  async getModelStats(modelId: string): Promise<LeaderboardEntry | null> {
    const model = await db.query.models.findFirst({
      where: eq(models.id, modelId),
    })
    
    if (!model) return null
    
    const winRate = model.totalDebates > 0 
      ? model.wins / model.totalDebates 
      : 0
    
    const controversyIndex = this.calculateControversyIndex(
      model.crowdRating,
      model.aiQualityRating
    )
    
    return {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      crowdRating: model.crowdRating,
      crowdRatingDeviation: model.crowdRatingDeviation,
      aiQualityRating: model.aiQualityRating,
      aiQualityRatingDeviation: model.aiQualityRatingDeviation,
      aiQualityVolatility: model.aiQualityVolatility,
      totalDebates: model.totalDebates,
      wins: model.wins,
      losses: model.losses,
      ties: model.ties,
      winRate,
      controversyIndex,
      isControversial: controversyIndex > 150,
    }
  }

  /**
   * Batch update scheduler - should be called every 24 hours
   * Processes all unprocessed debate results
   */
  async runBatchUpdate(): Promise<void> {
    console.log('Starting batch rating update...')
    
    // Get all completed debates that haven't been processed for ratings
    // In a real implementation, you'd track which debates have been processed
    // For now, we'll process debates from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const recentDebates = await db.query.debates.findMany({
      where: and(
        eq(debates.status, 'completed'),
        sql`${debates.completedAt} > ${oneDayAgo}`
      ),
    })
    
    const crowdResults: DebateResult[] = []
    const aiResults: DebateResult[] = []
    
    for (const debate of recentDebates) {
      // Process crowd votes
      if (debate.crowdWinner) {
        crowdResults.push({
          debateId: debate.id,
          modelAId: debate.proModelId,
          modelBId: debate.conModelId,
          winner: debate.crowdWinner as 'pro' | 'con' | 'tie',
          resultType: 'crowd',
          timestamp: debate.completedAt!,
        })
      }
      
      // Process AI judge results
      if (debate.aiJudgeWinner) {
        aiResults.push({
          debateId: debate.id,
          modelAId: debate.proModelId,
          modelBId: debate.conModelId,
          winner: debate.aiJudgeWinner as 'pro' | 'con' | 'tie',
          resultType: 'ai_quality',
          timestamp: debate.completedAt!,
        })
      }
    }
    
    // Update ratings
    await this.updateRatings([...crowdResults, ...aiResults])
    
    console.log(`Batch update complete. Processed ${crowdResults.length} crowd results and ${aiResults.length} AI results.`)
  }
}

// Export singleton instance
export const ratingEngine = new RatingEngine()
