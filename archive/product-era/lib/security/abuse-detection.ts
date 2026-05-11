/**
 * Anomalous Voting Pattern Detection
 * 
 * Detects suspicious voting patterns that may indicate manipulation or abuse.
 * 
 * Requirements: 15
 */

import { db } from '@/lib/db/client'
import { userVotes, debates, models } from '@/lib/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'

export interface VotingPattern {
  sessionId: string
  userId: string | null
  totalVotes: number
  votesInLastHour: number
  votesInLastDay: number
  providerBias: Record<string, number>
  alwaysVotesSameWay: boolean
  rapidVoting: boolean
  suspiciousIpActivity: boolean
  anomalyScore: number
  flags: string[]
}

/**
 * Analyze voting patterns for a session
 */
export async function analyzeVotingPattern(sessionId: string): Promise<VotingPattern> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // Get all votes for this session
  const allVotes = await db.query.userVotes.findMany({
    where: eq(userVotes.sessionId, sessionId),
    with: {
      debate: {
        with: {
          proModel: true,
          conModel: true,
        },
      },
    },
    orderBy: [desc(userVotes.createdAt)],
  })
  
  if (allVotes.length === 0) {
    return {
      sessionId,
      userId: null,
      totalVotes: 0,
      votesInLastHour: 0,
      votesInLastDay: 0,
      providerBias: {},
      alwaysVotesSameWay: false,
      rapidVoting: false,
      suspiciousIpActivity: false,
      anomalyScore: 0,
      flags: [],
    }
  }
  
  const userId = allVotes[0].userId
  const flags: string[] = []
  let anomalyScore = 0
  
  // Count votes in time windows
  const votesInLastHour = allVotes.filter(v => v.createdAt >= oneHourAgo).length
  const votesInLastDay = allVotes.filter(v => v.createdAt >= oneDayAgo).length
  
  // Check for rapid voting (more than 20 votes in an hour)
  const rapidVoting = votesInLastHour > 20
  if (rapidVoting) {
    flags.push(`Rapid voting: ${votesInLastHour} votes in last hour`)
    anomalyScore += 30
  }
  
  // Analyze provider bias
  const providerVotes: Record<string, { pro: number; con: number; tie: number }> = {}
  
  for (const vote of allVotes) {
    if (!vote.debate) continue
    
    const proProvider = vote.debate.proModel?.provider || 'unknown'
    const conProvider = vote.debate.conModel?.provider || 'unknown'
    
    if (!providerVotes[proProvider]) {
      providerVotes[proProvider] = { pro: 0, con: 0, tie: 0 }
    }
    if (!providerVotes[conProvider]) {
      providerVotes[conProvider] = { pro: 0, con: 0, tie: 0 }
    }
    
    if (vote.vote === 'pro') {
      providerVotes[proProvider].pro++
    } else if (vote.vote === 'con') {
      providerVotes[conProvider].con++
    } else {
      providerVotes[proProvider].tie++
      providerVotes[conProvider].tie++
    }
  }
  
  // Calculate provider bias scores
  const providerBias: Record<string, number> = {}
  
  for (const [provider, counts] of Object.entries(providerVotes)) {
    const total = counts.pro + counts.con + counts.tie
    if (total > 0) {
      // Bias score: how often they vote for this provider
      const favorScore = counts.pro / total
      providerBias[provider] = favorScore
      
      // Flag if consistently voting for one provider (>80%)
      if (total >= 5 && favorScore > 0.8) {
        flags.push(`Strong bias toward ${provider}: ${(favorScore * 100).toFixed(0)}% favor rate`)
        anomalyScore += 25
      }
    }
  }
  
  // Check if always votes the same way (pro, con, or tie)
  const voteTypes = { pro: 0, con: 0, tie: 0 }
  for (const vote of allVotes) {
    if (vote.vote === 'pro') voteTypes.pro++
    else if (vote.vote === 'con') voteTypes.con++
    else voteTypes.tie++
  }
  
  const totalVotes = allVotes.length
  const maxVoteType = Math.max(voteTypes.pro, voteTypes.con, voteTypes.tie)
  const alwaysVotesSameWay = totalVotes >= 5 && maxVoteType / totalVotes > 0.9
  
  if (alwaysVotesSameWay) {
    const dominantType = voteTypes.pro === maxVoteType ? 'pro' : voteTypes.con === maxVoteType ? 'con' : 'tie'
    flags.push(`Always votes ${dominantType}: ${(maxVoteType / totalVotes * 100).toFixed(0)}% of votes`)
    anomalyScore += 20
  }
  
  // Check for suspicious IP activity (multiple sessions from same IP)
  const ipAddress = allVotes[0].ipAddress
  let suspiciousIpActivity = false
  
  if (ipAddress) {
    const votesFromIp = await db.query.userVotes.findMany({
      where: and(
        eq(userVotes.ipAddress, ipAddress),
        gte(userVotes.createdAt, oneDayAgo)
      ),
    })
    
    // Count unique sessions from this IP
    const uniqueSessions = new Set(votesFromIp.map(v => v.sessionId))
    
    if (uniqueSessions.size > 5) {
      suspiciousIpActivity = true
      flags.push(`Multiple sessions from same IP: ${uniqueSessions.size} sessions`)
      anomalyScore += 35
    }
  }
  
  return {
    sessionId,
    userId,
    totalVotes,
    votesInLastHour,
    votesInLastDay,
    providerBias,
    alwaysVotesSameWay,
    rapidVoting,
    suspiciousIpActivity,
    anomalyScore,
    flags,
  }
}

/**
 * Get all suspicious sessions
 */
export async function getSuspiciousSessions(threshold: number = 50): Promise<VotingPattern[]> {
  // Get all unique sessions from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const recentVotes = await db
    .select({ sessionId: userVotes.sessionId })
    .from(userVotes)
    .where(gte(userVotes.createdAt, sevenDaysAgo))
    .groupBy(userVotes.sessionId)
  
  const uniqueSessions = recentVotes.map(v => v.sessionId)
  
  // Analyze each session
  const patterns: VotingPattern[] = []
  
  for (const sessionId of uniqueSessions) {
    const pattern = await analyzeVotingPattern(sessionId)
    
    if (pattern.anomalyScore >= threshold) {
      patterns.push(pattern)
    }
  }
  
  // Sort by anomaly score (highest first)
  patterns.sort((a, b) => b.anomalyScore - a.anomalyScore)
  
  return patterns
}

/**
 * Flag a session as suspicious
 */
export async function flagSession(sessionId: string, reason: string, flaggedBy: string): Promise<void> {
  // Store flag in Redis for quick access
  const { Redis } = await import('@upstash/redis')
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  
  const flagKey = `flagged:session:${sessionId}`
  const flagData = {
    sessionId,
    reason,
    flaggedBy,
    flaggedAt: new Date().toISOString(),
  }
  
  await redis.set(flagKey, JSON.stringify(flagData), { ex: 30 * 24 * 60 * 60 }) // 30 days
}

/**
 * Check if a session is flagged
 */
export async function isSessionFlagged(sessionId: string): Promise<boolean> {
  const { Redis } = await import('@upstash/redis')
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  
  const flagKey = `flagged:session:${sessionId}`
  const flagData = await redis.get(flagKey)
  
  return flagData !== null
}
