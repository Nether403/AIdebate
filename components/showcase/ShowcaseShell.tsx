import { ReactNode } from 'react'

interface ShowcaseShellProps {
  /** The page's single top-level heading (rendered as the only <h1>). */
  title: string
  /** Optional supporting intro text shown directly under the heading. */
  intro?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * ShowcaseShell — the shared page shell for the Showcase_Hub and every
 * Showcase_Demo_Page. It owns the consistent background treatment, container
 * width, horizontal padding, vertical section rhythm, and heading treatment, so
 * the surfaces read as one cohesive experience (Requirement 4.3).
 *
 * Background (Requirement 4.3 / 4.4): the showcase background is the global
 * `--color-bg` token (painted on <body>) layered with the single global
 * decorative NeuralBackground in `app/layout.tsx`. This shell is the ONE place
 * that decides the showcase background — and it deliberately paints none of its
 * own, deferring to that global token so the single decorative layer shows
 * through. Consuming pages (hub + demos) therefore MUST NOT declare their own
 * background.
 * ponytail: transparent-by-design rather than `bg-bg`, because an opaque shell
 * box would occlude the global z-0 NeuralBackground canvas; the body token
 * already supplies the surface color.
 *
 * Heading (Requirement 8.5): renders exactly one <h1> for the page, styled with
 * the hero typography token. Section subheadings are owned by SectionHeading
 * (level 2+), keeping the hierarchy non-skipping.
 *
 * Server component: layout only, no interactivity.
 */
export function ShowcaseShell({ title, intro, children, className = '' }: ShowcaseShellProps) {
  return (
    <div className={`relative min-h-screen ${className}`.trim()}>
      <div className="mx-auto w-full max-w-6xl px-[var(--space-lg)] py-[var(--space-section)] space-y-[var(--space-section)]">
        <header className="space-y-[var(--space-md)]">
          <h1 className="text-hero font-bold tracking-tight text-text">{title}</h1>
          {intro ? <p className="max-w-3xl text-body text-text-muted">{intro}</p> : null}
        </header>
        {children}
      </div>
    </div>
  )
}
