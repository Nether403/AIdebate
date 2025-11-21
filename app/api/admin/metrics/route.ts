/**
 * GET /api/admin/metrics
 * 
 * Get real-time debate metrics for admin dashboard
 * 
 * Requirements: 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, userVotes, debateTurns, factChecks } from '@/lib/db/schema'
import { gte, sql, desc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await stackServerApp.getUser()
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Get debate statistics
    const [totalDebates] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
    
    const [debatesLast24h] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
      .where(gte(debates.createdAt, oneDayAgo))
    
    const [debatesLast7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
      .where(gte(debates.createdAt, oneWeekAgo))
    
    const [completedDebates] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
      .where(eq(debates.status, 'completed'))
    
    const [inProgressDebates] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
      .where(eq(debates.status, 'in_progress'))
    
    const [failedDebates] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
      .where(eq(debates.status, 'failed'))
    
    // Get voting statistics
    const [totalVotes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userVotes)
    
    const [votesLast24h] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userVotes)
      .where(gte(userVotes.createdAt, oneDayAgo))
    
    const [votesLast7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userVotes)
      .where(gte(userVotes.createdAt, oneWeekAgo))
    
    // Get unique voters
    const [uniqueVoters] = await db
      .select({ count: sql<number>`count(distinct ${userVotes.sessionId})::int` })
      .from(userVotes)
    
    const [uniqueVotersLast24h] = await db
      .select({ count: sql<number>`count(distinct ${userVotes.sessionId})::int` })
      .from(userVotes)
      .where(gte(userVotes.createdAt, oneDayAgo))
    
    // Get fact-checking statistics
    const [totalFactChecks] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(factChecks)
    
    const [verifiedClaims] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(factChecks)
      .where(eq(factChecks.verdict, 'true'))
    
    const [falseClaims] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(factChecks)
      .where(eq(factChecks.verdict, 'false'))
    
    // Get recent debates
    const recentDebates = await db.query.debates.findMany({
      limit: 10,
      orderBy: [desc(debates.createdAt)],
      with: {
        topic: true,
        proModel: true,
        conModel: true,
      },
    })
    
    // Calculate average debate duration for completed debates
    const completedDebatesWithDuration = await db.query.debates.findMany({
      where: eq(debates.status, 'completed'),
      limit: 100,
      orderBy: [desc(debates.completedAt)],
    })
    
    let avgDurationMs = 0
    if (completedDebatesWithDuration.length > 0) {
      const totalDuration = completedDebatesWithDuration.reduce((sum, debate) => {
        if (debate.startedAt && debate.completedAt) {
          return sum + (debate.completedAt.getTime() - debate.startedAt.getTime())
        }
        return sum
      }, 0)
      avgDurationMs = totalDuration / completedDebatesWithDuration.length
    }
    
    return NextResponse.json({
      debates: {
        total: totalDebates.count,
        last24h: debatesLast24h.count,
        last7d: debatesLast7d.count,
        completed: completedDebates.count,
        inProgress: inProgressDebates.count,
        failed: failedDebates.count,
        avgDurationMs,
        recent: recentDebates.map(d => ({
          id: d.id,
          topic: d.topic.motion,
          proModel: d.proModel.name,
          conModel: d.conModel.name,
          status: d.status,
          winner: d.winner,
          createdAt: d.createdAt,
          completedAt: d.completedAt,
        })),
      },
      votes: {
        total: totalVotes.count,
        last24h: votesLast24h.count,
        last7d: votesLast7d.count,
        uniqueVoters: uniqueVoters.count,
        uniqueVotersLast24h: uniqueVotersLast24h.count,
      },
      factChecks: {
        total: totalFactChecks.count,
        verified: verifiedClaims.count,
        false: falseClaims.count,
        accuracyRate: totalFactChecks.count > 0 
          ? (verifiedClaims.count / totalFactChecks.count) * 100 
          : 0,
      },
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching admin metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
