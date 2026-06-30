import { ReactNode } from 'react'

interface SectionHeadingProps {
  /**
   * Heading level for this section. The page's single <h1> is owned by
   * ShowcaseShell, so sections start at level 2.
   *
   * Callers MUST NOT skip levels (e.g. an <h2> section must not jump to an
   * <h4> child). This component renders the element for the given level and
   * applies the matching Design_System typography token, but it cannot enforce
   * cross-component ordering — typing `level` to 2 | 3 | 4 keeps the contract
   * visible at every call site (Requirement 8.5).
   */
  level: 2 | 3 | 4
  children: ReactNode
  className?: string
}

/**
 * Hierarchical section heading. Renders the matching <h2>/<h3>/<h4> element and
 * applies the proportional Design_System typography token so visual weight
 * tracks the semantic level (Requirement 8.5). There is no --text-h4 token, so
 * level 4 steps down to the body token at a semibold weight, staying smaller
 * than level 3.
 */
export function SectionHeading({ level, children, className = '' }: SectionHeadingProps) {
  const Tag = `h${level}` as const

  // Token-based, proportional-to-level styling. No glow/neon on headings
  // (Requirement 2.5); accent emphasis is opt-in via ShimmerText.
  const levelClasses: Record<2 | 3 | 4, string> = {
    2: 'text-h2 font-bold tracking-tight',
    3: 'text-h3 font-semibold tracking-tight',
    4: 'text-body font-semibold',
  }

  return <Tag className={`text-text ${levelClasses[level]} ${className}`.trim()}>{children}</Tag>
}
