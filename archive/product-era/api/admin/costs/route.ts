/**
 * GET /api/admin/costs
 * 
 * Get API usage and cost data for admin dashboard
 * 
 * Requirements: 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDailyCostSummary, getCostHistory, checkSpendingCap } from '@/lib/security/cost-monitoring'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await stackServerApp.getUser()
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Get current spending status
    const spendingStatus = await checkSpendingCap()
    
    // Get today's summary
    const todaySummary = await getDailyCostSummary()
    
    // Get historical data
    const history = await getCostHistory(days)
    
    return NextResponse.json({
      current: {
        ...spendingStatus,
        breakdown: {
          byProvider: todaySummary.byProvider,
          byOperation: todaySummary.byOperation,
        },
        totalRequests: todaySummary.totalRequests,
      },
      history: history.map(h => ({
        date: h.date,
        totalCost: h.totalCost,
        totalRequests: h.totalRequests,
        capExceeded: h.capExceeded,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching cost data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost data' },
      { status: 500 }
    )
  }
}
