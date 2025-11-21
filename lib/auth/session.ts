/**
 * Session Management for Anonymous Voting
 * 
 * Provides session tracking for users who haven't signed in yet.
 * Uses secure HTTP-only cookies to prevent manipulation.
 * 
 * Requirements: 7, 15
 */

import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export interface SessionInfo {
  sessionId: string
  userId: string | null
  isAuthenticated: boolean
}

/**
 * Get or create a session ID for the current user
 * Uses HTTP-only cookies for security
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('debate_session_id')?.value
  
  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set('debate_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
  }
  
  return sessionId
}

/**
 * Get session information including authentication status
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  const sessionId = await getOrCreateSessionId()
  
  // TODO: Integrate with Stack Auth to get user ID
  // For now, return null for userId (anonymous)
  // When Stack Auth is integrated:
  // const user = await stackServerApp.getUser()
  // userId = user?.id || null
  
  return {
    sessionId,
    userId: null,
    isAuthenticated: false,
  }
}

/**
 * Clear session (for logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('debate_session_id')
}

