'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Showcase segment error boundary — the backstop half of the navigation-failure
 * strategy (Requirement 4.7, 5.5). When a Showcase_Demo_Page fails to render
 * during/after navigation (an async failure the hub's on-click try/catch cannot
 * observe), this boundary catches it and renders a visible "couldn't open that
 * demo" view — never a blank or broken page — with a way to retry or return to
 * the hub.
 *
 * Renders inside the global AppShell (no self nav/background). Uses the themed
 * Card + Button primitives so the surface resolves from theme tokens. Exactly
 * one <h1>.
 */
export default function ShowcaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Showcase navigation error:', error)
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--status-high)]/25 bg-[var(--status-high)]/10">
          <AlertTriangle className="h-7 w-7 text-[var(--status-high)]" aria-hidden="true" />
        </div>

        <div className="mt-5 space-y-2">
          <h1 className="text-xl font-semibold text-card-foreground">We couldn&apos;t open that demo</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Something went wrong loading the selected demo. You can try again or return to the
            showcase.
          </p>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} className="min-h-11">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/showcase">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to showcase
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
