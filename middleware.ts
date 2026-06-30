/**
 * Route guard for the Showcase_Experience (Requirement 6.5).
 *
 * If a Visitor requests a path corresponding to excluded content (prediction
 * markets, betting/points, badges, social-share/follow, leaderboards, virality
 * — see `EXCLUDED_PATTERNS`), we never render that content: we redirect to an
 * exposed approved destination (`/showcase`, the Showcase_Hub). `/showcase`
 * itself matches no excluded pattern, so this cannot loop.
 *
 * Runs on the Edge runtime. `EXCLUDED_PATTERNS` comes from the single source of
 * truth in `lib/design-system/manifest.ts` (pure JS regex/Set data, Edge-safe).
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { EXCLUDED_PATTERNS } from '@/lib/design-system/manifest'

/** Exposed approved destination to fall back to (Requirement 6, criterion 4). */
const APPROVED_DESTINATION = '/showcase'

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.redirect(new URL(APPROVED_DESTINATION, request.url))
  }

  return NextResponse.next()
}

export const config = {
  /**
   * Scope to page routes only. Skip Next internals (`/_next`), API routes
   * (untouched so health/data endpoints keep working), and any path with a file
   * extension (static assets like favicon.ico, images, fonts). The approved
   * routes and `/` never match an excluded pattern, so they pass through.
   */
  matcher: ['/((?!_next/|api/|.*\\.[\\w]+$).*)'],
}
