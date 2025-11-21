/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  start(name: string) {
    this.metrics.set(name, performance.now())
  }

  /**
   * End timing and log the duration
   */
  end(name: string): number {
    const startTime = this.metrics.get(name)
    if (!startTime) {
      console.warn(`Performance metric "${name}" was never started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.metrics.delete(name)

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  /**
   * Measure an async function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * Measure a sync function
   */
  measureSync<T>(name: string, fn: () => T): T {
    this.start(name)
    try {
      const result = fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Report Web Vitals to console (development) or analytics (production)
 */
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric)
  }

  // In production, send to analytics service
  // Example: sendToAnalytics(metric)
}

/**
 * Measure component render time
 */
export function useRenderTime(componentName: string) {
  if (typeof window === 'undefined') return

  const startTime = performance.now()

  return () => {
    const duration = performance.now() - startTime
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 ${componentName} render: ${duration.toFixed(2)}ms`)
    }
  }
}

/**
 * Check if performance API is available
 */
export function isPerformanceSupported(): boolean {
  return typeof window !== 'undefined' && 'performance' in window
}

/**
 * Get navigation timing metrics
 */
export function getNavigationMetrics() {
  if (!isPerformanceSupported()) return null

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (!navigation) return null

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    load: navigation.loadEventEnd - navigation.loadEventStart,
    total: navigation.loadEventEnd - navigation.fetchStart,
  }
}

/**
 * Log performance metrics in development
 */
export function logPerformanceMetrics() {
  if (process.env.NODE_ENV !== 'development') return
  if (!isPerformanceSupported()) return

  const metrics = getNavigationMetrics()
  if (!metrics) return

  console.group('📊 Performance Metrics')
  console.log('DNS Lookup:', `${metrics.dns.toFixed(2)}ms`)
  console.log('TCP Connection:', `${metrics.tcp.toFixed(2)}ms`)
  console.log('Request Time:', `${metrics.request.toFixed(2)}ms`)
  console.log('Response Time:', `${metrics.response.toFixed(2)}ms`)
  console.log('DOM Processing:', `${metrics.dom.toFixed(2)}ms`)
  console.log('Load Event:', `${metrics.load.toFixed(2)}ms`)
  console.log('Total Time:', `${metrics.total.toFixed(2)}ms`)
  console.groupEnd()
}
