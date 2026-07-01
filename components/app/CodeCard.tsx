'use client'

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Mono code / API block: a {@link Card} surface with a labelled header and a
 * copy-to-clipboard button. Code content renders in Geist Mono (`font-mono` ->
 * `--font-mono`, Req 1.8). Replaces the retired `EmbedNote`.
 *
 * The copy button reuses the {@link Button} primitive so it inherits the shared
 * cyan focus ring (`--ring`); a 44x44 minimum target and an `aria-label` that
 * flips to "Copied" keep it keyboard- and screen-reader-accessible (Req 13.1.3).
 */
function CodeCard({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = React.useState(false)
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    []
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable (insecure context / permission denied) — keep state
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border py-2.5 pr-2 pl-5">
        <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy ${label} to clipboard`}
          className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5 text-primary" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre className="overflow-x-auto px-5 py-3.5 font-mono text-[13px] leading-relaxed text-card-foreground">
        <code>{code}</code>
      </pre>
    </Card>
  )
}

export { CodeCard }
