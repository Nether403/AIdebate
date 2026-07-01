'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Route-level error boundary for the debate viewer.
 *
 * Renders inside the AppShell (no self nav/background). Reserves a centered
 * layout box matching the viewer's content width so the error surface does not
 * shift the shell (Req 11.5). Exactly one <h1>.
 */
export default function DebateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Debate error:', error)
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--status-high)]/25 bg-[var(--status-high)]/10">
          <AlertTriangle className="h-7 w-7 text-[var(--status-high)]" aria-hidden="true" />
        </div>

        <div className="mt-5 space-y-2">
          <h1 className="text-xl font-semibold text-card-foreground">Failed to load debate</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We couldn&apos;t load this debate. It may not exist or there was an error retrieving it.
          </p>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} className="min-h-11">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/debate/new">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Start new debate
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
