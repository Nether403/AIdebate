'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DebateConfigForm, type DebateConfig } from '@/components/debate'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { AlertCircle } from 'lucide-react'

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
      
      // Redirect to the debate page
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumbs items={[{ label: 'New Debate' }]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Debate</h1>
          <p className="text-slate-400">
            Configure the debate parameters and start a new LLM evaluation session
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <DebateConfigForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}
