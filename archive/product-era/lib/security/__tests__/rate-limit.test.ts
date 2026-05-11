/**
 * Rate Limiting Tests
 * 
 * Tests for IP-based rate limiting functionality
 * 
 * Requirements: 15
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rate-limit'
import { NextRequest } from 'next/server'

describe('Rate Limiting', () => {
  const testConfig = {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    keyPrefix: 'test:ratelimit',
  }

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const key = `test-${Date.now()}`
      
      // First request should succeed
      const result1 = await checkRateLimit(key, testConfig)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(4)
      
      // Second request should succeed
      const result2 = await checkRateLimit(key, testConfig)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('should block requests exceeding limit', async () => {
      const key = `test-${Date.now()}`
      
      // Make max requests
      for (let i = 0; i < testConfig.maxRequests; i++) {
        const result = await checkRateLimit(key, testConfig)
        expect(result.success).toBe(true)
      }
      
      // Next request should be blocked
      const blockedResult = await checkRateLimit(key, testConfig)
      expect(blockedResult.success).toBe(false)
      expect(blockedResult.remaining).toBe(0)
    })

    it('should provide correct reset time', async () => {
      const key = `test-${Date.now()}`
      
      const result = await checkRateLimit(key, testConfig)
      expect(result.reset).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })
  })

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })
      
      const ip = getClientIp(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      })
      
      const ip = getClientIp(request)
      expect(ip).toBe('192.168.1.2')
    })

    it('should return unknown if no IP headers present', () => {
      const request = new NextRequest('http://localhost:3000')
      
      const ip = getClientIp(request)
      expect(ip).toBe('unknown')
    })
  })
})
