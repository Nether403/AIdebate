import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { SetTopBar } from '@/components/layout/SetTopBar'
import { SHOWCASE_ENTRIES, isRealRoute } from '@/lib/design-system/manifest'

export const metadata: Metadata = {
  title: 'Showcase · LLMargument',
  description:
    'One debate engine, many surfaces — explore interactive demos of the LLM debate benchmarking and alignment-research workbench.',
}

/**
 * Showcase_Hub — rendered inside the global AppShell (which owns the sidebar,
 * top bar, and ambient background; this page declares none of its own, per
 * Requirement 2.6). The top bar breadcrumb is set declaratively through the
 * {@link SetTopBar} bridge so the page can stay a server component and keep its
 * `metadata` export.
 *
 * The demo grid maps the typed `SHOWCASE_ENTRIES` registry (never a hard-coded
 * list) in declared order (Req 4.1), renders each as a Design_System {@link Card}
 * with a single activatable link (Req 4.2), and omits any entry whose link does
 * not resolve to a real route, rendering the remaining valid entries (Req 4.5).
 * If no valid entries remain, an empty-state message is shown and no cards
 * (Req 4.4).
 */
export default function ShowcasePage() {
  // Req 4.1: preserve the manifest declaration order.
  // Req 4.5: omit entries whose link does not resolve to a member of EXISTING_ROUTES.
  const entries = SHOWCASE_ENTRIES.filter((entry) => isRealRoute(entry.href))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <SetTopBar breadcrumb={[{ label: 'Workbench', href: '/' }, { label: 'Showcase' }]} />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          One debate engine, many surfaces
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          The same engine that produces inspectable debate artifacts can power evaluation, data
          generation, and product features. Each demo below runs on a curated sample artifact, so it
          loads instantly with no live model calls.
        </p>
      </header>

      {entries.length === 0 ? (
        <p role="status" className="text-muted-foreground">
          No demonstrations available.
        </p>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2">
          {entries.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              aria-label={entry.title}
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary/40">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-card-foreground">{entry.title}</h2>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{entry.description}</p>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
