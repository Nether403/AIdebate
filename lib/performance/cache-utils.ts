/**
 * Cache utilities for performance optimization
 */

// In-memory cache with TTL
class MemoryCache {
  private cache: Map<string, { value: any; expires: number }> = new Map()

  set(key: string, value: any, ttlSeconds: number = 300) {
    const expires = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expires })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

export const memoryCache = new MemoryCache()

/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { ttl?: number; keyFn?: (...args: Parameters<T>) => string } = {}
): T {
  const { ttl = 300, keyFn = (...args) => JSON.stringify(args) } = options

  return ((...args: Parameters<T>) => {
    const key = `memoize:${fn.name}:${keyFn(...args)}`
    const cached = memoryCache.get<ReturnType<T>>(key)

    if (cached !== null) {
      return cached
    }

    const result = fn(...args)
    memoryCache.set(key, result, ttl)
    return result
  }) as T
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  leaderboard: (sortBy: string, filters?: any) =>
    `leaderboard:${sortBy}:${JSON.stringify(filters || {})}`,
  
  modelStats: (modelId: string) => `model:${modelId}:stats`,
  
  debateTranscript: (debateId: string) => `debate:${debateId}:transcript`,
  
  topicList: (category?: string) => `topics:${category || 'all'}`,
  
  personaList: () => 'personas:all',
}

/**
 * Prefetch data for better UX
 */
export async function prefetchData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = memoryCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetcher()
  memoryCache.set(key, data, ttl)
  return data
}
