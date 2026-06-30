/**
 * SectionSkeleton — token-styled placeholder shown while a pending landing
 * section streams in (Requirement 11.4). Rendered as the `fallback` of a
 * `<Suspense>` boundary so each section's skeleton is progressively replaced by
 * its real content as it becomes available, instead of leaving blank space.
 *
 * Built only from the `.skeleton` primitive (defined once in `app/globals.css`)
 * and Design_System spacing/radius tokens — no literal colors. The shape mirrors
 * each section (centered heading + optional media / card grid) so the swap to
 * real content produces no layout shift (Requirement 11.3). Purely decorative,
 * so it is hidden from assistive tech (`aria-hidden`).
 *
 * Server component: no interactivity, no `'use client'`.
 */
interface SectionSkeletonProps {
  /** Number of card placeholders to render in the body grid (0 = none). */
  cards?: number
  /** Render a tall media placeholder matching the infographic aspect ratio. */
  media?: boolean
}

export function SectionSkeleton({ cards = 0, media = false }: SectionSkeletonProps) {
  return (
    <section className="space-y-[var(--space-xl)]" aria-hidden="true">
      {/* Heading + supporting-line placeholders */}
      <div className="mx-auto max-w-2xl space-y-[var(--space-sm)] text-center">
        <div className="skeleton mx-auto h-8 w-56 max-w-full" />
        <div className="skeleton mx-auto h-4 w-80 max-w-full" />
      </div>

      {media && <div className="skeleton mx-auto aspect-[1024/558] w-full max-w-3xl" />}

      {cards > 0 && (
        <div className="grid gap-[var(--space-lg)] md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="skeleton h-40 w-full" />
          ))}
        </div>
      )}

      {!media && cards === 0 && <div className="skeleton mx-auto h-48 w-full max-w-3xl" />}
    </section>
  )
}
