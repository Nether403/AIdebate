'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DebateConfigForm, type DebateConfig } from '@/components/debate'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { AlertCircle, Terminal } from 'lucide-react'

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

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        <Breadcrumbs items={[{ label: 'New Benchmark Run' }]} />
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-slate-400 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>graph-orchestrator-v2</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Create Benchmark Run
          </h1>
          <p className="text-slate-400 text-sm font-light leading-relaxed">
            Configure the debate graph parameters, target debater models, fact-checker modes, and total argument rounds.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-slideIn">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-400">Launch Failure</h4>
              <p className="text-red-400 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        <DebateConfigForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}

