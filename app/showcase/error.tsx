'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { GlassPanel } from '@/components/showcase/GlassPanel'

/**
 * Showcase segment error boundary — the backstop half of the navigation-failure
 * strategy (Requirement 4.7, 5.5). When a Showcase_Demo_Page fails to render
 * during/after navigation (an async failure the hub's on-click try/catch cannot
 * observe), this boundary catches it and renders a visible "couldn't open that
 * demo" view inside the shared {@link ShowcaseShell} — never a blank or broken
 * page — with a way to retry or return to the hub.
 *
 * Token-only styling (Requirement 1.4 / 10.2): the error accent uses the
 * `accent-4` (amber) Design_System token rather than any raw color.
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
    <ShowcaseShell title="We couldn't open that demo">
      <GlassPanel className="flex flex-col items-start gap-[var(--space-md)] rounded-card p-[var(--space-lg)]">
        <div className="flex items-center gap-[var(--space-sm)] text-body text-text">
          <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-accent-4" />
          <span>
            Something went wrong loading the selected demo. You can try again or return to the
            showcase.
          </span>
        </div>

        <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-[var(--space-sm)] rounded-pill border border-accent-primary px-[var(--space-md)] text-body text-accent-primary transition-colors hover:bg-accent-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/showcase"
            className="inline-flex min-h-11 items-center gap-[var(--space-sm)] rounded-pill border border-border px-[var(--space-md)] text-body text-text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to showcase
          </Link>
        </div>
      </GlassPanel>
    </ShowcaseShell>
  )
}
