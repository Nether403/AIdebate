'use client'

import { Code2 } from 'lucide-react'

interface EmbedNoteProps {
  title?: string
  description: string
  snippet: string
  language?: string
}

/**
 * The "how this embeds" footer shown on every showcase demo. It turns the
 * visual demo back into the headless integration story without losing the visual.
 */
export function EmbedNote({ title = 'How this embeds', description, snippet }: EmbedNoteProps) {
  return (
    <div className="mt-8 rounded-card border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-raised">
        <Code2 className="w-4 h-4 text-accent-primary" />
        <span className="text-caption font-medium text-text">{title}</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-caption text-text-muted leading-relaxed">{description}</p>
        <pre className="text-caption bg-bg border border-border rounded-card p-3 overflow-x-auto text-text">
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  )
}
