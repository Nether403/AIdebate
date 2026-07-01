'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DebateConfigForm, type DebateConfig } from '@/components/debate'
import { useTopBar } from '@/components/layout/TopBarContext'
import { AlertCircle, Terminal } from 'lucide-react'

const FORM_ID = 'debate-config-form'

export default function NewDebatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (config: DebateConfig) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/debate/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start debate')
      }

      const data = await response.json()

      const debateId = data.debateId || data.debate?.id
      if (!debateId) {
        throw new Error('No debate ID returned from server')
      }
      router.push(`/debate/${debateId}`)
    } catch (err) {
      console.error('Failed to start debate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Primary action lives in the top bar (Req: primary action in the top bar).
  // It submits the config form by id so the form keeps ownership of validation.
  const submitForm = useCallback(() => {
    const form = document.getElementById(FORM_ID) as HTMLFormElement | null
    form?.requestSubmit()
  }, [])

  useTopBar({
    breadcrumb: [{ label: 'Benchmark runs', href: '/debate/new' }, { label: 'New run' }],
    primaryAction: { label: isLoading ? 'Starting…' : 'Run debate', onClick: submitForm },
  })

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>graph-orchestrator-v2</span>
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Create benchmark run
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Configure the debate graph parameters, target debater models, fact-checker modes, and
          total argument rounds.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[var(--status-high)]/30 bg-[var(--status-high)]/10 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--status-high)]" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--status-high)]">Launch failure</h2>
            <p className="mt-1 text-xs text-[var(--status-high)]">{error}</p>
          </div>
        </div>
      )}

      <DebateConfigForm formId={FORM_ID} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
