import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables must be set')
}

// Create Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Cache utility functions
export const cache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get<T>(key)
      return value
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  },

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length === 0) return 0
      await redis.del(...keys)
      return keys.length
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
      return 0
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key)
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error)
      return 0
    }
  },

  /**
   * Set expiration on a key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await redis.expire(key, seconds)
      return true
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error)
      return false
    }
  },
}

// Cache key builders for consistency
export const cacheKeys = {
  debate: (id: string) => `debate:${id}`,
  debateList: (page: number, limit: number) => `debates:list:${page}:${limit}`,
  leaderboard: (type: 'crowd' | 'ai_quality') => `leaderboard:${type}`,
  modelStats: (modelId: string) => `model:${modelId}:stats`,
  topicList: (category?: string) => category ? `topics:${category}` : 'topics:all',
  userVotes: (sessionId: string) => `user:${sessionId}:votes`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
}
