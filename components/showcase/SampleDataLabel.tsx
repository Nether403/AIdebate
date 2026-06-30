import { FlaskConical } from 'lucide-react'

interface SampleDataLabelProps {
  /** Optional extra classes for positioning within an illustrative section. */
  className?: string
}

/**
 * Visible "Sample / demo data" label co-located within illustrative sections so
 * a Visitor can never mistake demo content for a real benchmark artifact
 * (Requirement 5.4). Server component, no interactivity.
 *
 * Styling is muted-but-readable and token-only: `text-text-muted` on
 * `bg-surface-raised` clears the 4.5:1 contrast threshold in both themes. The
 * text is meaningful and stays readable (not `aria-hidden`); only the decorative
 * icon is hidden from assistive tech.
 */
export function SampleDataLabel({ className = '' }: SampleDataLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-[var(--space-xs)] rounded-pill border border-border bg-surface-raised px-[var(--space-sm)] py-[var(--space-xs)] text-caption font-medium text-text-muted ${className}`}
    >
      <FlaskConical className="h-3.5 w-3.5 text-accent-4" aria-hidden="true" />
      Sample / demo data
    </span>
  )
}
