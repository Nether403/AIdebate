import * as React from "react"

import { cn } from "@/lib/utils"

export interface StatProps {
  /** lucide-react icon component, rendered with `className` + `strokeWidth`. */
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  /** Icon color utility, e.g. `text-cyan-300` | `text-rose-400` | `text-slate-400`. */
  iconClass: string
  /** Uppercase caption. */
  label: string
  /** The big value (a model name or a number). */
  value: string
  /** Small subtext below the value. */
  sub: string
  /**
   * Hero KPI emphasis. Only the highlighted Stat gets the cyan-tinted
   * accent-gradient surface + glow; every other Stat uses the plain
   * token surface. This enforces accent discipline (Req 1.5/1.6): the
   * gradient/glow appears solely on the single emphasis role.
   */
  highlight?: boolean
}

/**
 * KPI tile for stat rows (canonical eval-report screen).
 *
 * Surfaces resolve from theme tokens so the tile works in dark and light:
 * - non-highlight: translucent `bg-card` + hairline `border-border` (the plain
 *   Card surface).
 * - highlight: cyan accent-gradient wash (`--primary`) + soft `--glow-cyan`
 *   halo, reserved for the single hero KPI.
 *
 * The value carries `tabular-nums` so numeric readouts align (Req 13.1) without
 * forcing monospace on text values like model names.
 */
export function Stat({
  icon: Icon,
  iconClass,
  label,
  value,
  sub,
  highlight = false,
}: StatProps): React.JSX.Element {
  return (
    <div
      data-slot="stat"
      data-highlight={highlight}
      className={cn(
        "rounded-xl border p-4 backdrop-blur-sm",
        highlight
          ? "border-primary/20 bg-gradient-to-b from-primary/[0.08] to-transparent shadow-[0_0_40px_-8px_var(--glow-cyan)]"
          : "border-border bg-card"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", iconClass)} strokeWidth={2} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="truncate text-lg font-semibold tabular-nums text-card-foreground">
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
