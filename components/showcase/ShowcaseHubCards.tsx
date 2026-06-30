'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, AlertTriangle } from 'lucide-react'

import { GlassPanel } from '@/components/showcase/GlassPanel'
import { SectionHeading } from '@/components/showcase/SectionHeading'
import { AnimateIn } from '@/components/showcase/AnimateIn'
import { SHOWCASE_ENTRIES } from '@/lib/design-system/manifest'

/**
 * ShowcaseHubCards — the navigable demo grid for the Showcase_Hub, extracted as
 * a client component so it can own navigation-failure handling (Requirement 4.7,
 * 5.5). Each entry from the typed {@link SHOWCASE_ENTRIES} registry renders as a
 * real `next/link` card (preserving accessibility, prefetch, and modified-click
 * "open in new tab" semantics), but a plain left-click is intercepted and routed
 * through a guarded programmatic navigation.
 *
 * On a navigation failure the Visitor STAYS on the hub: we never leave the
 * current page, and instead surface a visible "couldn't open that demo" alert
 * (Requirement 4.7). This is the on-hub half of the design's two-part error
 * strategy; the `app/showcase/error.tsx` boundary is the backstop for the other
 * half (async destination-render failures — see the ponytail note below).
 */
export function ShowcaseHubCards() {
  const router = useRouter()
  const [failedTitle, setFailedTitle] = useState<string | null>(null)

  function openDemo(event: MouseEvent<HTMLAnchorElement>, href: string, title: string) {
    // Let the browser handle modified clicks (new tab/window, etc.) natively via
    // the real href, so link semantics and accessibility are preserved.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    setFailedTitle(null)
    try {
      router.push(href)
    } catch (err) {
      // ponytail: App Router programmatic navigation only surfaces *synchronous*
      // failures to this try/catch (e.g. an invalid/blocked push). Async
      // destination-render errors are caught by the app/showcase/error.tsx
      // boundary backstop instead. Either way the Visitor never sees a blank or
      // broken view (Requirement 4.7, 5.5).
      console.error('Showcase demo navigation failed:', err)
      setFailedTitle(title)
    }
  }

  return (
    <div className="space-y-[var(--space-md)]">
      {failedTitle ? (
        <div
          role="alert"
          className="flex items-center gap-[var(--space-sm)] rounded-card border border-accent-4 px-[var(--space-md)] py-[var(--space-sm)] text-body text-text"
        >
          <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-accent-4" />
          <span>We couldn&apos;t open the {failedTitle} demo. Please try again.</span>
        </div>
      ) : null}

      <section className="grid gap-[var(--space-lg)] sm:grid-cols-2">
        {SHOWCASE_ENTRIES.map((entry) => (
          <AnimateIn key={entry.href} kind="entrance" className="h-full">
            <Link
              href={entry.href}
              aria-label={entry.title}
              onClick={(event) => openDemo(event, entry.href, entry.title)}
              className="group block h-full rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <GlassPanel className="flex h-full flex-col rounded-card p-[var(--space-lg)]">
                <div className="mb-[var(--space-sm)] flex items-center justify-between gap-[var(--space-sm)]">
                  <SectionHeading level={2} className="text-h3">
                    {entry.title}
                  </SectionHeading>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent-primary"
                  />
                </div>
                <p className="text-body text-text-muted">{entry.description}</p>
              </GlassPanel>
            </Link>
          </AnimateIn>
        ))}
      </section>
    </div>
  )
}
