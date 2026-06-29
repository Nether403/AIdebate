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
    <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <Code2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-slate-200">{title}</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        <pre className="text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-3 overflow-x-auto text-slate-300">
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  )
}
