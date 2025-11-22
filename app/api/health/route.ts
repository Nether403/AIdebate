import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { Redis } from '@upstash/redis'

/**
 * Enhanced health check endpoint for Render monitoring
 * Tests database, cache, and API connectivity
 * Returns detailed service status and performance metrics
 */
export async function GET() {
  const checks: Record<string, any> = {}
  let overallStatus = 'healthy'
  const startTime = Date.now()

  try {
    // Check database connection
    const dbStartTime = Date.now()
    await db.execute('SELECT 1')
    const dbLatency = Date.now() - dbStartTime
    
    checks.database = {
      status: 'connected',
      latency_ms: dbLatency,
      healthy: dbLatency < 1000 // Warn if DB latency > 1s
    }

    if (dbLatency >= 1000) {
      overallStatus = 'degraded'
    }
  } catch (error) {
    checks.database = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      healthy: false
    }
    overallStatus = 'unhealthy'
  }

  // Check Redis cache
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      
      const cacheStartTime = Date.now()
      await redis.ping()
      const cacheLatency = Date.now() - cacheStartTime
      
      checks.cache = {
        status: 'connected',
        latency_ms: cacheLatency,
        healthy: cacheLatency < 500
      }

      if (cacheLatency >= 500) {
        overallStatus = 'degraded'
      }
    } else {
      checks.cache = {
        status: 'not_configured',
        healthy: true // Cache is optional
      }
    }
  } catch (error) {
    checks.cache = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      healthy: false
    }
    // Cache failure is not critical
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded'
    }
  }

  // Check LLM API keys
  const apiKeys = {
    openai: !!process.env.OPENAI_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
    xai: !!process.env.XAI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
  }

  const missingKeys = Object.entries(apiKeys)
    .filter(([_, exists]) => !exists)
    .map(([key]) => key)

  checks.api_keys = {
    configured: apiKeys,
    missing: missingKeys,
    healthy: apiKeys.openai && apiKeys.google && apiKeys.tavily // Minimum required
  }

  if (!checks.api_keys.healthy) {
    overallStatus = 'unhealthy'
  }

  // Check authentication
  checks.authentication = {
    stack_auth: !!(
      process.env.NEXT_PUBLIC_STACK_PROJECT_ID &&
      process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY &&
      process.env.STACK_SECRET_SERVER_KEY
    ),
    healthy: true // Auth is optional for anonymous voting
  }

  // System metrics
  const totalLatency = Date.now() - startTime
  
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    response_time_ms: totalLatency,
    services: checks,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  }

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(response, { status: statusCode })
}
