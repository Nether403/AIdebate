import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Themed translucent surface (replaces the retired `GlassPanel`).
 * Background/border resolve from theme tokens (`--card`, `--border`) so the
 * same component works in dark and light with no per-screen overrides.
 * Padding is owned by children (e.g. `CardHeader`, body wrappers).
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Card header with a title and optional muted hint, matching the canonical
 * eval-report reference screen.
 */
function CardHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
      {hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

export { Card, CardHeader }
