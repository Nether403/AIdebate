'use client'

import { Pause, Play } from 'lucide-react'

interface SimulatorControlsProps {
  /** Whether the auto-advancing sequence is currently running. Controlled by the parent. */
  playing: boolean
  /** Invoked synchronously on activation so the parent can flip its timer state. */
  onToggle: () => void
  className?: string
}

/**
 * Pure contract helper (Requirement 9.7): an auto-advancing sequence starts
 * PAUSED under reduced motion and requires explicit user action to advance.
 * Simulator pages compute their initial `playing` state via
 * `initialPlaying(useReducedMotion() ?? false)`. Kept pure so task 4.6 can unit
 * test the "starts paused under reduced motion" behavior without a DOM.
 */
export function initialPlaying(reducedMotion: boolean): boolean {
  return !reducedMotion
}

/**
 * Persistent pause/resume control for an auto-advancing simulated sequence
 * (Requirement 9.3). This is a controlled, presentational component: the parent
 * owns the auto-advance timer and is the source of truth for `playing`.
 *
 * - The button is always rendered (persistently visible) and invokes `onToggle`
 *   SYNCHRONOUSLY on click — no internal timer/debounce — so the parent can stop
 *   the sequence well within the 100ms budget (Requirement 9.4).
 * - When not playing, a visible "Paused" indicator is shown (Requirement 9.4).
 * - The button meets the 44x44 minimum target (`min-h-11 min-w-11`,
 *   Requirement 7.6), carries a visible focus ring, and reflects its state via
 *   `aria-pressed` and a state-specific `aria-label` (Requirement 8.4).
 */
export function SimulatorControls({ playing, onToggle, className }: SimulatorControlsProps) {
  const label = playing ? 'Pause auto-advancing sequence' : 'Resume auto-advancing sequence'

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={!playing}
        aria-label={label}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:border-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {playing ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{playing ? 'Pause' : 'Resume'}</span>
      </button>

      {!playing && (
        <span
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-2 text-sm text-text-muted"
        >
          <span className="h-2 w-2 rounded-pill bg-accent-4" aria-hidden="true" />
          Paused
        </span>
      )}
    </div>
  )
}
