/**
 * Prediction Market Logic
 * 
 * Handles betting, odds calculation, and payouts for the debate prediction market.
 * Uses a parimutuel betting system where odds are determined by the bet pool.
 * 
 * Requirements: 10
 */

import { db } from '@/lib/db/client'
import { userVotes, userProfiles, debates } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export interface BetPool {
  proTotal: number
  conTotal: number
  tieTotal: number
  totalPool: number
}

export interface Odds {
  pro: number
  con: number
  tie: number
}

export interface BetResult {
  success: boolean
  newBalance: number
  payout: number
  odds: Odds
  message: string
}

/**
 * Calculate current odds for a debate based on the bet pool
 * Uses parimutuel betting formula: odds = totalPool / sidePool
 * Minimum odds of 1.1x to ensure some return
 */
export function calculateOdds(pool: BetPool): Odds {
  const minOdds = 1.1
  const houseEdge = 0.05 // 5% house edge
  const effectivePool = pool.totalPool * (1 - houseEdge)
  
  // If no bets yet, return even odds
  if (pool.totalPool === 0) {
    return { pro: 2.0, con: 2.0, tie: 3.0 }
  }
  
  // Calculate odds for each outcome
  const proOdds = pool.proTotal > 0 
    ? Math.max(minOdds, effectivePool / pool.proTotal)
    : 10.0 // High odds if no one bet on this side
  
  const conOdds = pool.conTotal > 0
    ? Math.max(minOdds, effectivePool / pool.conTotal)
    : 10.0
  
  const tieOdds = pool.tieTotal > 0
    ? Math.max(minOdds, effectivePool / pool.tieTotal)
    : 15.0 // Even higher odds for tie
  
  return {
    pro: Math.round(proOdds * 100) / 100,
    con: Math.round(conOdds * 100) / 100,
    tie: Math.round(tieOdds * 100) / 100,
  }
}

/**
 * Get current bet pool for a debate
 */
export async function getBetPool(debateId: string): Promise<BetPool> {
  const votes = await db.query.userVotes.findMany({
    where: eq(userVotes.debateId, debateId),
  })
  
  const pool: BetPool = {
    proTotal: 0,
    conTotal: 0,
    tieTotal: 0,
    totalPool: 0,
  }
  
  for (const vote of votes) {
    if (vote.wagerAmount > 0) {
      if (vote.vote === 'pro') {
        pool.proTotal += vote.wagerAmount
      } else if (vote.vote === 'con') {
        pool.conTotal += vote.wagerAmount
      } else {
        pool.tieTotal += vote.wagerAmount
      }
      pool.totalPool += vote.wagerAmount
    }
  }
  
  return pool
}

/**
 * Get current odds for a debate
 */
export async function getCurrentOdds(debateId: string): Promise<Odds> {
  const pool = await getBetPool(debateId)
  return calculateOdds(pool)
}

/**
 * Get or create user profile
 */
export async function getOrCreateUserProfile(sessionId: string, userId: string | null = null) {
  // Try to find existing profile by session ID
  let profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.sessionId, sessionId),
  })
  
  // If not found and userId provided, try by userId
  if (!profile && userId) {
    profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    })
  }
  
  // Create new profile if doesn't exist
  if (!profile) {
    const [newProfile] = await db.insert(userProfiles).values({
      userId: userId || `anon_${sessionId}`,
      sessionId,
      debatePoints: 1000, // Starting balance
    }).returning()
    
    return newProfile
  }
  
  return profile
}

/**
 * Place a bet on a debate
 */
export async function placeBet(
  debateId: string,
  sessionId: string,
  vote: 'pro' | 'con' | 'tie',
  wagerAmount: number,
  userId: string | null = null
): Promise<BetResult> {
  try {
    // Validate wager amount
    if (wagerAmount < 10) {
      return {
        success: false,
        newBalance: 0,
        payout: 0,
        odds: { pro: 0, con: 0, tie: 0 },
        message: 'Minimum bet is 10 DebatePoints',
      }
    }
    
    if (wagerAmount > 500) {
      return {
        success: false,
        newBalance: 0,
        payout: 0,
        odds: { pro: 0, con: 0, tie: 0 },
        message: 'Maximum bet is 500 DebatePoints',
      }
    }
    
    // Get user profile
    const profile = await getOrCreateUserProfile(sessionId, userId)
    
    // Check if user has enough points
    if (profile.debatePoints < wagerAmount) {
      return {
        success: false,
        newBalance: profile.debatePoints,
        payout: 0,
        odds: { pro: 0, con: 0, tie: 0 },
        message: `Insufficient DebatePoints. You have ${profile.debatePoints}, need ${wagerAmount}`,
      }
    }
    
    // Get current odds before placing bet
    const currentOdds = await getCurrentOdds(debateId)
    const oddsAtBet = vote === 'pro' ? currentOdds.pro : vote === 'con' ? currentOdds.con : currentOdds.tie
    
    // Deduct points from user balance
    await db.update(userProfiles)
      .set({
        debatePoints: sql`${userProfiles.debatePoints} - ${wagerAmount}`,
        totalBetsPlaced: sql`${userProfiles.totalBetsPlaced} + 1`,
        totalPointsWagered: sql`${userProfiles.totalPointsWagered} + ${wagerAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, profile.id))
    
    // Get updated balance
    const updatedProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, profile.id),
    })
    
    return {
      success: true,
      newBalance: updatedProfile?.debatePoints || 0,
      payout: 0, // Will be calculated when debate completes
      odds: currentOdds,
      message: `Bet placed successfully! Odds: ${oddsAtBet}x`,
    }
  } catch (error) {
    console.error('Error placing bet:', error)
    return {
      success: false,
      newBalance: 0,
      payout: 0,
      odds: { pro: 0, con: 0, tie: 0 },
      message: error instanceof Error ? error.message : 'Failed to place bet',
    }
  }
}

/**
 * Calculate and distribute payouts for a completed debate
 */
export async function distributePayout(debateId: string, winner: 'pro' | 'con' | 'tie'): Promise<void> {
  try {
    // Get all votes for this debate
    const votes = await db.query.userVotes.findMany({
      where: eq(userVotes.debateId, debateId),
    })
    
    // Process each vote
    for (const vote of votes) {
      if (vote.wagerAmount > 0 && vote.oddsAtBet) {
        const wasCorrect = vote.vote === winner
        let payoutAmount = 0
        
        if (wasCorrect) {
          // Winner gets their wager back plus winnings
          payoutAmount = Math.floor(vote.wagerAmount * vote.oddsAtBet)
        }
        
        // Update vote record
        await db.update(userVotes)
          .set({
            wasCorrect,
            payoutAmount,
          })
          .where(eq(userVotes.id, vote.id))
        
        // Update user profile
        if (payoutAmount > 0) {
          await db.update(userProfiles)
            .set({
              debatePoints: sql`${userProfiles.debatePoints} + ${payoutAmount}`,
              totalBetsWon: sql`${userProfiles.totalBetsWon} + 1`,
              totalPointsWon: sql`${userProfiles.totalPointsWon} + ${payoutAmount}`,
              correctPredictions: sql`${userProfiles.correctPredictions} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(userProfiles.sessionId, vote.sessionId))
          
          // Check if user qualifies for Superforecaster badge
          const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.sessionId, vote.sessionId),
          })
          
          if (profile && profile.totalBetsPlaced >= 10) {
            const accuracy = profile.correctPredictions / profile.totalBetsPlaced
            if (accuracy >= 0.8 && !profile.isSuperforecaster) {
              await db.update(userProfiles)
                .set({
                  isSuperforecaster: true,
                  updatedAt: new Date(),
                })
                .where(eq(userProfiles.id, profile.id))
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error distributing payouts:', error)
    throw error
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(sessionId: string) {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.sessionId, sessionId),
  })
  
  if (!profile) {
    return null
  }
  
  const accuracy = profile.totalBetsPlaced > 0
    ? (profile.correctPredictions / profile.totalBetsPlaced) * 100
    : 0
  
  const roi = profile.totalPointsWagered > 0
    ? ((profile.totalPointsWon - profile.totalPointsWagered) / profile.totalPointsWagered) * 100
    : 0
  
  return {
    debatePoints: profile.debatePoints,
    totalVotes: profile.totalVotes,
    totalBetsPlaced: profile.totalBetsPlaced,
    totalBetsWon: profile.totalBetsWon,
    correctPredictions: profile.correctPredictions,
    accuracy: Math.round(accuracy * 10) / 10,
    roi: Math.round(roi * 10) / 10,
    isSuperforecaster: profile.isSuperforecaster,
    totalPointsWagered: profile.totalPointsWagered,
    totalPointsWon: profile.totalPointsWon,
    netProfit: profile.totalPointsWon - profile.totalPointsWagered,
  }
}

/**
 * Get user betting history
 */
export async function getBettingHistory(sessionId: string, limit: number = 20) {
  const votes = await db.query.userVotes.findMany({
    where: and(
      eq(userVotes.sessionId, sessionId),
      sql`${userVotes.wagerAmount} > 0`
    ),
    with: {
      debate: {
        with: {
          topic: true,
          proModel: true,
          conModel: true,
        },
      },
    },
    orderBy: (votes, { desc }) => [desc(votes.createdAt)],
    limit,
  })
  
  return votes.map(vote => ({
    id: vote.id,
    debateId: vote.debateId,
    topic: vote.debate?.topic?.motion || 'Unknown topic',
    vote: vote.vote,
    wagerAmount: vote.wagerAmount,
    oddsAtBet: vote.oddsAtBet,
    payoutAmount: vote.payoutAmount,
    wasCorrect: vote.wasCorrect,
    profit: vote.payoutAmount - vote.wagerAmount,
    createdAt: vote.createdAt,
    debateStatus: vote.debate?.status,
  }))
}
