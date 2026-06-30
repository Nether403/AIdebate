import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface BackToHubProps {
  className?: string
}

/**
 * BackToHub — the return link shown on every Showcase_Demo_Page, targeting the
 * Showcase_Hub at `/showcase` (Requirement 4.2). Rendered as a real `next/link`.
 *
 * Meets the 44×44 CSS-px minimum interactive target (Requirement 7.6) via
 * min-h-11 + padding, and exposes a visible accent-token focus ring
 * (Requirement 8.4), mirroring the CtaButton focus treatment. The visible
 * "Back to showcase" text is the accessible name; the arrow icon is decorative
 * and hidden from assistive tech.
 *
 * Server component: a plain link, no interactivity.
 */
export function BackToHub({ className = '' }: BackToHubProps) {
  const classes =
    'inline-flex items-center gap-2 min-h-11 text-caption font-medium text-text-muted ' +
    'px-[var(--space-md)] py-[var(--space-sm)] rounded-pill transition-colors hover:text-text ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

  return (
    <Link href="/showcase" className={`${classes} ${className}`.trim()}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>Back to showcase</span>
    </Link>
  )
}
