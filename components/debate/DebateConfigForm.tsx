'use client'

import { useState, useEffect } from 'react'
import { Shuffle, Cpu, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Model, Topic, Persona } from '@/types'

interface DebateConfigFormProps {
  onSubmit: (config: DebateConfig) => void
  isLoading?: boolean
  /** Optional id so an external primary action (the top bar) can submit the form. */
  formId?: string
}

export interface DebateConfig {
  proModelId: string
  conModelId: string
  topicId?: string
  topicSelection: 'random' | 'manual'
  proPersonaId?: string | null
  conPersonaId?: string | null
  totalRounds: number
  wordLimitPerTurn?: number
  factCheckMode: 'off' | 'standard' | 'strict'
}

// Shared token-styled control + label classes. shadcn has no `select`/`label`
// primitive in this project, so native controls are themed from tokens (kept
// minimal, per the design's guidance) and inherit the shared cyan focus ring.
const selectClass =
  'h-10 w-full rounded-md border border-input bg-input/30 px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'
const labelClass = 'block text-xs font-medium uppercase tracking-wider text-muted-foreground'
const optionClass = 'bg-popover text-popover-foreground'

export function DebateConfigForm({ onSubmit, isLoading = false, formId }: DebateConfigFormProps) {
  const [models, setModels] = useState<Model[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])

  const [config, setConfig] = useState<DebateConfig>({
    proModelId: '',
    conModelId: '',
    topicSelection: 'random',
    totalRounds: 3,
    wordLimitPerTurn: 250,
    factCheckMode: 'standard',
  })

  const [topicMode, setTopicMode] = useState<'random' | 'manual'>('random')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const [modelsRes, topicsRes, personasRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/topics'),
        fetch('/api/personas'),
      ])

      const [modelsData, topicsData, personasData] = await Promise.all([
        modelsRes.json(),
        topicsRes.json(),
        personasRes.json(),
      ])

      setModels(modelsData.filter((m: Model) => m.isActive))
      setTopics(topicsData.filter((t: Topic) => t.isActive))
      setPersonas(personasData.filter((p: Persona) => p.isActive))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleRandomTopic = () => {
    if (topics.length > 0) {
      const randomTopic = topics[Math.floor(Math.random() * topics.length)]
      setConfig({ ...config, topicId: randomTopic.id })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!config.proModelId || !config.conModelId) {
      alert('Please select both Pro and Con models')
      return
    }

    if (config.proModelId === config.conModelId) {
      alert('Pro and Con models must be different')
      return
    }

    if (topicMode === 'manual' && !config.topicId) {
      alert('Please select a topic')
      return
    }

    const finalConfig: DebateConfig = {
      ...config,
      topicSelection: topicMode,
    }

    if (topicMode === 'manual' && config.topicId) {
      finalConfig.topicId = config.topicId
    } else {
      delete finalConfig.topicId
    }

    onSubmit(finalConfig)
  }

  if (loadingData) {
    return (
      <Card className="space-y-6 p-6 md:p-8">
        <Skeleton className="h-5 w-44" />
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-16" />
        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
          Syncing model registries…
        </p>
      </Card>
    )
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      aria-busy={isLoading}
      className="space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground backdrop-blur-sm md:p-8"
    >
      <div className="mb-2 flex items-center gap-3 border-b border-border pb-4">
          <Cpu className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
            Run configuration
          </h2>
        </div>

        {/* Model selection */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="pro-model" className={labelClass}>
              Pro model (affirmative)
            </label>
            <select
              id="pro-model"
              value={config.proModelId}
              onChange={(e) => setConfig({ ...config, proModelId: e.target.value })}
              className={selectClass}
              disabled={isLoading}
              required
            >
              <option value="" className={optionClass}>
                Select a model…
              </option>
              {models.map((model) => (
                <option key={model.id} value={model.id} className={optionClass}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="con-model" className={labelClass}>
              Con model (negative)
            </label>
            <select
              id="con-model"
              value={config.conModelId}
              onChange={(e) => setConfig({ ...config, conModelId: e.target.value })}
              className={selectClass}
              disabled={isLoading}
              required
            >
              <option value="" className={optionClass}>
                Select a model…
              </option>
              {models.map((model) => (
                <option key={model.id} value={model.id} className={optionClass}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Persona selection */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="pro-persona" className={labelClass}>
              Pro persona <span className="lowercase text-muted-foreground/70">(optional)</span>
            </label>
            <select
              id="pro-persona"
              value={config.proPersonaId || ''}
              onChange={(e) => setConfig({ ...config, proPersonaId: e.target.value || null })}
              className={selectClass}
              disabled={isLoading}
            >
              <option value="" className={optionClass}>
                Default benchmarking behavior
              </option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id} className={optionClass}>
                  {persona.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="con-persona" className={labelClass}>
              Con persona <span className="lowercase text-muted-foreground/70">(optional)</span>
            </label>
            <select
              id="con-persona"
              value={config.conPersonaId || ''}
              onChange={(e) => setConfig({ ...config, conPersonaId: e.target.value || null })}
              className={selectClass}
              disabled={isLoading}
            >
              <option value="" className={optionClass}>
                Default benchmarking behavior
              </option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id} className={optionClass}>
                  {persona.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Topic selection */}
        <div className="space-y-3 pt-2">
          <span className={labelClass}>Topic / motion selection</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={topicMode === 'random' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTopicMode('random')
                setConfig({ ...config, topicSelection: 'random', topicId: undefined })
              }}
            >
              Random selection
            </Button>
            <Button
              type="button"
              variant={topicMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTopicMode('manual')
                setConfig({ ...config, topicSelection: 'manual' })
              }}
            >
              Manual selection
            </Button>
          </div>

          {topicMode === 'manual' && (
            <div className="space-y-3">
              <select
                aria-label="Curated topic motion"
                value={config.topicId || ''}
                onChange={(e) => setConfig({ ...config, topicId: e.target.value || undefined })}
                className={selectClass}
                disabled={isLoading}
                required={topicMode === 'manual'}
              >
                <option value="" className={optionClass}>
                  Select a curated topic motion…
                </option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id} className={optionClass}>
                    {topic.motion} [{topic.category} - {topic.difficulty}]
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={handleRandomTopic}>
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                Draw random curated topic
              </Button>
            </div>
          )}

          {topicMode === 'random' && (
            <p className="inline-block rounded-lg border border-border bg-card px-3 py-2 text-xs italic text-muted-foreground">
              A random topic will be selected automatically from the active pool at graph initiation.
            </p>
          )}
        </div>

        {/* Debate settings */}
        <div className="grid gap-5 pt-2 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="total-rounds" className={labelClass}>
              Total rounds
            </label>
            <select
              id="total-rounds"
              value={config.totalRounds}
              onChange={(e) => setConfig({ ...config, totalRounds: parseInt(e.target.value) })}
              className={selectClass}
              disabled={isLoading}
            >
              <option value={1} className={optionClass}>1 round (smoke test)</option>
              <option value={2} className={optionClass}>2 rounds</option>
              <option value={3} className={optionClass}>3 rounds (standard)</option>
              <option value={4} className={optionClass}>4 rounds</option>
              <option value={5} className={optionClass}>5 rounds (deep benchmark)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="factcheck-mode" className={labelClass}>
              Fact-checking gate mode
            </label>
            <select
              id="factcheck-mode"
              value={config.factCheckMode}
              onChange={(e) => setConfig({ ...config, factCheckMode: e.target.value as DebateConfig['factCheckMode'] })}
              className={selectClass}
              disabled={isLoading}
            >
              <option value="off" className={optionClass}>Off (lightweight / dry runs)</option>
              <option value="standard" className={optionClass}>Standard (claim source-checking)</option>
              <option value="strict" className={optionClass}>Strict (rejects false claim drafts)</option>
            </select>
          </div>
        </div>

        <p className={cn('flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground', !isLoading && 'sr-only')}>
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
          Spawning LangGraph session…
        </p>
    </form>
  )
}
