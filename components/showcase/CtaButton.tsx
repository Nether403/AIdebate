import { ReactNode } from 'react'
import Link from 'next/link'

interface CtaButtonProps {
  variant: 'primary' | 'secondary'
  /** A real, resolvable route (never an anchor-only "#"). */
  href: string
  children: ReactNode
  className?: string
}

/**
 * Call-to-action rendered as a real `next/link` (Requirement 5.3 — never an
 * anchor-only "#"). Accent color comes only from the Design_System accent token
 * (Requirement 1.6). Both variants meet the 44×44 CSS-px minimum interactive
 * target (Requirement 7.6) via min-h-11/min-w-11 plus padding, and expose a
 * visible focus ring (Requirement 8.4).
 *
 * The secondary variant is deliberately distinct from the primary across all
 * three of fill, size, and weight (Requirement 3.4), so neither emphasis style
 * is reused:
 *   - fill   primary = solid accent background; secondary = transparent + outline
 *   - size   primary = text-body;              secondary = text-caption
 *   - weight primary = font-bold;              secondary = font-medium
 */
/**
 * Variant style source of truth. Exported (not inlined) so unit tests assert
 * the REAL rendered classes — confirming the secondary variant reuses none of
 * the primary's fill (`bg-accent-primary`), size (`text-body`), or weight
 * (`font-bold`) emphasis (Requirement 3.4) — rather than duplicated constants.
 */
export const CTA_VARIANT_CLASSES: Record<'primary' | 'secondary', string> = {
  primary:
    'bg-accent-primary text-bg font-bold text-body ' +
    'px-[var(--space-xl)] py-[var(--space-md)] shadow-elevation-2 hover:opacity-90',
  secondary:
    'bg-transparent border border-accent-primary text-accent-primary font-medium text-caption ' +
    'px-[var(--space-lg)] py-[var(--space-sm)] hover:bg-accent-primary/10',
}

export function CtaButton({ variant, href, children, className = '' }: CtaButtonProps) {
  // Shared: target size, shape, focus ring (accent token), layout.
  const base =
    'inline-flex items-center justify-center gap-2 min-h-11 min-w-11 rounded-pill ' +
    'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

  return (
    <Link href={href} className={`${base} ${CTA_VARIANT_CLASSES[variant]} ${className}`.trim()}>
      {children}
    </Link>
  )
}
