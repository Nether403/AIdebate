import type { Metadata } from 'next'
import Link from 'next/link'

import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { ShowcaseHubCards } from '@/components/showcase/ShowcaseHubCards'

export const metadata: Metadata = {
  title: 'Showcase · LLMargument',
  description:
    'One debate engine, many surfaces — explore interactive demos of the LLM debate benchmarking and alignment-research workbench.',
}

/**
 * Showcase_Hub — rendered through the shared {@link ShowcaseShell} (which owns
 * the single <h1> and the showcase background; this page declares none of its
 * own, per Requirement 4.3/4.4). The demo grid is delegated to the client
 * {@link ShowcaseHubCards}, which maps the typed `SHOWCASE_ENTRIES` registry
 * (never a hard-coded list) so the bounded title/description and real-route
 * invariants are enforced in one place (Requirement 4.1, 5.2).
 *
 * Navigation-failure handling (Requirement 4.7, 5.5) lives in two places: the
 * on-hub caught-route-error in `ShowcaseHubCards` keeps the Visitor on the hub
 * with a visible "couldn't open that demo" alert, and the
 * `app/showcase/error.tsx` boundary is the backstop for async destination
 * failures — together they guarantee no blank/broken view.
 */
export default function ShowcasePage() {
  return (
    <ShowcaseShell
      title="One debate engine, many surfaces"
      intro="The same engine that produces inspectable debate artifacts can power evaluation, data generation, and product features. Each demo below runs on a curated sample artifact, so it loads instantly with no live model calls."
    >
      <ShowcaseHubCards />

      <div>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-caption text-text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-pill px-[var(--space-sm)]"
        >
          ← Back to home
        </Link>
      </div>
    </ShowcaseShell>
  )
}
