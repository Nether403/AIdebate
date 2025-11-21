import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

/**
 * Health check endpoint for Render monitoring
 * Tests database connectivity and returns service status
 */
export async function GET() {
  try {
    // Check database connection
    const startTime = Date.now()
    await db.execute('SELECT 1')
    const dbLatency = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'connected',
          latency_ms: dbLatency
        },
        api: {
          status: 'operational'
        }
      },
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
