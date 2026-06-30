import type { ElementType, ReactNode } from 'react'

/**
 * ShimmerText — accent gradient heading treatment. Wraps the single consolidated
 * `.shimmer-text` primitive defined once in `app/globals.css` (Requirement 1.7).
 *
 * This is an emphasis-only treatment (Requirement 2.5): use it for hero / section
 * emphasis headings, never for body text. Its shimmer animation is disabled under
 * `prefers-reduced-motion` in the shared CSS (Requirement 2.7).
 *
 * Renders an inline element (`<span>` by default); pass `as` to emphasise within
 * a heading element. Server component: no interactivity.
 */
interface ShimmerTextProps {
  as?: ElementType
  className?: string
  children: ReactNode
}

export function ShimmerText({ as: Tag = 'span', className, children }: ShimmerTextProps) {
  return <Tag className={`shimmer-text ${className ?? ''}`.trim()}>{children}</Tag>
}
