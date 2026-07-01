import * as React from "react"

import { cn } from "@/lib/utils"

export type BadgeTone = "neutral" | "accent"

/**
 * Pill badge in two tones, both sourced from theme tokens (Req 1.11):
 * - `neutral`: muted hairline pill (e.g. "sample / demo data").
 * - `accent`: cyan-tinted pill on the single accent identity
 *   (e.g. "model-based signal · not ground truth").
 * The honesty-label badges wrap this component.
 */
function Badge({
  children,
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tone === "accent"
          ? "border-primary/30 bg-primary/10 text-[#155e75] dark:text-primary"
          : "border-border bg-foreground/[0.04] text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
