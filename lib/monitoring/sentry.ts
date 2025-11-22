/**
 * Sentry Error Tracking Integration
 * 
 * Provides centralized error tracking and monitoring
 * Optional - only activates if SENTRY_DSN is configured
 */

interface SentryConfig {
  dsn?: string
  environment: string
  enabled: boolean
}

class SentryClient {
  private config: SentryConfig
  private initialized = false

  constructor() {
    this.config = {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      enabled: !!process.env.SENTRY_DSN,
    }
  }

  /**
   * Initialize Sentry (call this in app startup)
   */
  init() {
    if (!this.config.enabled) {
      console.log('Sentry not configured - error tracking disabled')
      return
    }

    // In a real implementation, you would initialize Sentry SDK here
    // For now, we'll use a simple logging approach
    this.initialized = true
    console.log(`Sentry initialized for ${this.config.environment}`)
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.config.enabled) {
      console.error('Error:', error)
      if (context) console.error('Context:', context)
      return
    }

    // Log error with context
    console.error('[Sentry]', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      environment: this.config.environment,
      timestamp: new Date().toISOString(),
    })

    // In production, this would send to Sentry API
    // For now, we just log it
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (!this.config.enabled) {
      console.log(`[${level.toUpperCase()}]`, message)
      if (context) console.log('Context:', context)
      return
    }

    console.log('[Sentry]', {
      message,
      level,
      context,
      environment: this.config.environment,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string }) {
    if (!this.config.enabled) return

    console.log('[Sentry] User context set:', user.id)
  }

  /**
   * Add breadcrumb (trail of events leading to error)
   */
  addBreadcrumb(breadcrumb: {
    message: string
    category?: string
    level?: 'info' | 'warning' | 'error'
    data?: Record<string, any>
  }) {
    if (!this.config.enabled) return

    console.log('[Sentry] Breadcrumb:', breadcrumb)
  }

  /**
   * Track performance
   */
  startTransaction(name: string, op: string) {
    if (!this.config.enabled) {
      return {
        finish: () => {},
        setStatus: (_status: string) => {},
      }
    }

    const startTime = Date.now()

    return {
      finish: () => {
        const duration = Date.now() - startTime
        console.log('[Sentry] Transaction:', {
          name,
          op,
          duration_ms: duration,
        })
      },
      setStatus: (status: string) => {
        console.log('[Sentry] Transaction status:', status)
      },
    }
  }
}

// Export singleton instance
export const sentry = new SentryClient()

/**
 * Error boundary wrapper for API routes
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context?: Record<string, any>
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      sentry.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          ...context,
          args: args.map(arg => {
            // Sanitize sensitive data
            if (typeof arg === 'object' && arg !== null) {
              const sanitized = { ...arg }
              if ('password' in sanitized) sanitized.password = '[REDACTED]'
              if ('apiKey' in sanitized) sanitized.apiKey = '[REDACTED]'
              if ('token' in sanitized) sanitized.token = '[REDACTED]'
              return sanitized
            }
            return arg
          }),
        }
      )
      throw error
    }
  }) as T
}

/**
 * Track debate lifecycle events
 */
export function trackDebateEvent(
  event: 'started' | 'completed' | 'failed' | 'timeout',
  debateId: string,
  metadata?: Record<string, any>
) {
  sentry.addBreadcrumb({
    message: `Debate ${event}`,
    category: 'debate',
    level: event === 'failed' ? 'error' : 'info',
    data: {
      debate_id: debateId,
      ...metadata,
    },
  })
}

/**
 * Track API usage for cost monitoring
 */
export function trackAPIUsage(
  provider: string,
  model: string,
  tokens: { input: number; output: number },
  cost: number
) {
  sentry.addBreadcrumb({
    message: 'API call',
    category: 'api',
    level: 'info',
    data: {
      provider,
      model,
      input_tokens: tokens.input,
      output_tokens: tokens.output,
      estimated_cost: cost,
    },
  })
}

/**
 * Track performance metrics
 */
export function trackPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  if (duration > 5000) {
    // Warn if operation takes > 5 seconds
    sentry.captureMessage(
      `Slow operation: ${operation} took ${duration}ms`,
      'warning',
      metadata
    )
  }
}
