/**
 * Rate Limiting Middleware
 * 
 * Implements IP-based and session-based rate limiting to prevent abuse.
 * Uses Redis for distributed rate limiting across multiple instances.
 * 
 * Requirements: 15
 */

import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redisKey = `${config.keyPrefix}:${key}`
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // Remove old entries
  await redis.zremrangebyscore(redisKey, 0, windowStart)
  
  // Count requests in current window
  const count = await redis.zcard(redisKey)
  
  if (count >= config.maxRequests) {
    // Get the oldest request timestamp to calculate reset time
    const oldest = await redis.zrange(redisKey, 0, 0, { withScores: true }) as Array<{ score: number; member: string }>
    const resetTime = oldest.length > 0 
      ? oldest[0].score + config.windowMs
      : now + config.windowMs
    
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: Math.ceil(resetTime / 1000),
    }
  }
  
  // Add current request
  await redis.zadd(redisKey, { score: now, member: `${now}:${Math.random()}` })
  
  // Set expiry on the key
  await redis.expire(redisKey, Math.ceil(config.windowMs / 1000))
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - count - 1,
    reset: Math.ceil((now + config.windowMs) / 1000),
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback to a default (should not happen in production)
  return 'unknown'
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const ip = getClientIp(request)
  const result = await checkRateLimit(ip, config)
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.reset - Math.floor(Date.now() / 1000)} seconds.`,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
        },
      }
    )
  }
  
  // Add rate limit headers to successful responses
  return null // Continue to next middleware/handler
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // General API endpoints - 100 requests per hour
  api: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'ratelimit:api',
  },
  
  // Voting endpoint - 20 votes per hour
  voting: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'ratelimit:vote',
  },
  
  // Debate creation - 10 debates per hour
  debateCreation: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'ratelimit:debate',
  },
  
  // Authenticated users - 500 requests per hour
  authenticated: {
    maxRequests: 500,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'ratelimit:auth',
  },
}

