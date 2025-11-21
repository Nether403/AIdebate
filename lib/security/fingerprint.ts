/**
 * Session Fingerprinting
 * 
 * Creates a unique fingerprint for each session based on browser characteristics
 * to detect potential abuse and vote manipulation.
 * 
 * Requirements: 15
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'

export interface SessionFingerprint {
  hash: string
  userAgent: string
  acceptLanguage: string
  acceptEncoding: string
  ip: string
  timestamp: number
}

/**
 * Generate a fingerprint hash from request headers
 */
export function generateFingerprint(request: NextRequest): SessionFingerprint {
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  const acceptEncoding = request.headers.get('accept-encoding') || 'unknown'
  
  // Get IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  
  // Create fingerprint string
  const fingerprintString = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`
  
  // Hash the fingerprint
  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex')
  
  return {
    hash,
    userAgent,
    acceptLanguage,
    acceptEncoding,
    ip,
    timestamp: Date.now(),
  }
}

/**
 * Compare two fingerprints to detect similarity
 * Returns a score from 0 (completely different) to 1 (identical)
 */
export function compareFingerprin(fp1: SessionFingerprint, fp2: SessionFingerprint): number {
  let score = 0
  let factors = 0
  
  // Exact hash match
  if (fp1.hash === fp2.hash) {
    return 1.0
  }
  
  // User agent similarity
  factors++
  if (fp1.userAgent === fp2.userAgent) {
    score += 0.4
  }
  
  // IP address match
  factors++
  if (fp1.ip === fp2.ip) {
    score += 0.3
  }
  
  // Language match
  factors++
  if (fp1.acceptLanguage === fp2.acceptLanguage) {
    score += 0.2
  }
  
  // Encoding match
  factors++
  if (fp1.acceptEncoding === fp2.acceptEncoding) {
    score += 0.1
  }
  
  return score
}

/**
 * Detect if a fingerprint is suspicious based on patterns
 */
export function isSuspiciousFingerprint(fingerprint: SessionFingerprint): {
  suspicious: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  
  // Check for missing or generic user agent
  if (fingerprint.userAgent === 'unknown' || fingerprint.userAgent.length < 10) {
    reasons.push('Missing or invalid user agent')
  }
  
  // Check for bot-like user agents
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python']
  if (botPatterns.some(pattern => fingerprint.userAgent.toLowerCase().includes(pattern))) {
    reasons.push('Bot-like user agent detected')
  }
  
  // Check for missing IP
  if (fingerprint.ip === 'unknown') {
    reasons.push('Missing IP address')
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  }
}
