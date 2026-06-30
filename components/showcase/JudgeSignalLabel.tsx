import { Bot } from 'lucide-react'

interface JudgeSignalLabelProps {
  /** Optional extra classes for positioning adjacent to judge output. */
  className?: string
}

/**
 * Visible "Model-based signal, not ground truth" label placed adjacent to any
 * judge output (scores, winner, reasoning) to keep the honest research framing
 * required by AGENTS.md — judge output is a model-based signal, never ground
 * truth (Requirement 6.1). Server component, no interactivity.
 *
 * Same token-only, muted-but-readable treatment as SampleDataLabel:
 * `text-text-muted` on `bg-surface-raised` clears 4.5:1 contrast in both themes.
 * The text is meaningful and readable; only the decorative icon is hidden.
 */
export function JudgeSignalLabel({ className = '' }: JudgeSignalLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-[var(--space-xs)] rounded-pill border border-border bg-surface-raised px-[var(--space-sm)] py-[var(--space-xs)] text-caption font-medium text-text-muted ${className}`}
    >
      <Bot className="h-3.5 w-3.5 text-accent-2" aria-hidden="true" />
      Model-based signal, not ground truth
    </span>
  )
}
