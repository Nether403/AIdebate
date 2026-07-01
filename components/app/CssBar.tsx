import { cn } from '@/lib/utils'

export type Severity = 'low' | 'elevated' | 'high'

export interface SeverityStyle {
  /** Text color class for the numeric value. */
  text: string
  /** Background color class for the status dot. */
  dot: string
  /** Tailwind gradient stop classes for a comparison bar fill. */
  bar: string
  /** Text label, so severity never relies on color alone (Req 9.4). */
  label: Severity
}

/**
 * Maps a charismatic-liar count to a status style.
 *
 * Thresholds follow Requirement 13.2 (the source of truth):
 *   0      → low      (signature cyan→violet gradient)
 *   1–2    → elevated (amber)
 *   ≥3     → high     (rose)
 *
 * Severity is conveyed via dot + numeric value + text label, never color alone
 * (Req 9.4), so consumers render `dot`, the count, and `label` together.
 */
export function severity(count: number): SeverityStyle {
  if (count >= 3) {
    return { text: 'text-rose-400', dot: 'bg-rose-500', bar: 'from-rose-500 to-rose-400', label: 'high' }
  }
  if (count >= 1) {
    return { text: 'text-amber-400', dot: 'bg-amber-500', bar: 'from-amber-500 to-amber-400', label: 'elevated' }
  }
  // 0 (and any non-positive) → low, the signature accent gradient.
  return { text: 'text-cyan-300', dot: 'bg-cyan-400', bar: 'from-cyan-500 to-violet-500', label: 'low' }
}

/**
 * Fill width as a percentage in [0, 100], proportional to value/max.
 * Pure and exported so the bar math stays trivially testable (see task 4.5).
 * Edge cases: max ≤ 0 or non-finite → 0; value < 0 → 0; value > max → 100.
 */
export function clampFillPercent(value: number, max: number): number {
  if (!(max > 0)) return 0
  const pct = (value / max) * 100
  if (!Number.isFinite(pct)) return 0
  return Math.min(100, Math.max(0, pct))
}

export interface CssBarProps {
  value: number
  max: number
  /** Tailwind gradient stop classes for the fill, e.g. `severity(cl).bar`. */
  barClass: string
}

/**
 * A pure-CSS gradient comparison bar (no Recharts). The track stays a fixed
 * width; the fill width is clamped to [0, 100]% proportional to value/max.
 */
export function CssBar({ value, max, barClass }: CssBarProps) {
  const width = clampFillPercent(value, max)
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]" role="presentation">
      <div
        className={cn('h-full rounded-full bg-gradient-to-r', barClass)}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export interface LegendDotProps {
  /** Color/gradient classes for the dot (e.g. `severity(n).dot` or a gradient). */
  className: string
  label: string
}

/** Small colored dot + text label for chart legends. */
export function LegendDot({ className, label }: LegendDotProps) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', className)} aria-hidden="true" />
      {label}
    </span>
  )
}
