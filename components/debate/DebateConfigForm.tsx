'use client'

import { useState, useEffect } from 'react'
import { Shuffle, Cpu, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react'
import type { Model, Topic, Persona } from '@/types'

interface DebateConfigFormProps {
  onSubmit: (config: DebateConfig) => void
  isLoading?: boolean
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

export function DebateConfigForm({ onSubmit, isLoading = false }: DebateConfigFormProps) {
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
      <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Syncing Model Registries...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent blur-2xl pointer-events-none" />
      
      <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
        <Cpu className="w-5 h-5 text-cyan-400" />
        <h2 className="text-xl font-bold text-white tracking-tight">Run Configuration</h2>
      </div>

      {/* Model Selection Row */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider">
            Pro Model (Affirmative)
          </label>
          <select
            value={config.proModelId}
            onChange={(e) => setConfig({ ...config, proModelId: e.target.value })}
            className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300"
            required
          >
            <option value="" className="bg-slate-950">Select a model...</option>
            {models.map((model) => (
              <option key={model.id} value={model.id} className="bg-slate-950">
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-rose-300 uppercase tracking-wider">
            Con Model (Negative)
          </label>
          <select
            value={config.conModelId}
            onChange={(e) => setConfig({ ...config, conModelId: e.target.value })}
            className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30 transition-all duration-300"
            required
          >
            <option value="" className="bg-slate-950">Select a model...</option>
            {models.map((model) => (
              <option key={model.id} value={model.id} className="bg-slate-950">
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Persona Selection Row */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pro Persona <span className="text-[10px] lowercase text-slate-500">(optional)</span>
          </label>
          <select
            value={config.proPersonaId || ''}
            onChange={(e) => setConfig({ ...config, proPersonaId: e.target.value || null })}
            className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 transition-all duration-300"
          >
            <option value="" className="bg-slate-950">Default Benchmarking Behavior</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id} className="bg-slate-950">
                {persona.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Con Persona <span className="text-[10px] lowercase text-slate-500">(optional)</span>
          </label>
          <select
            value={config.conPersonaId || ''}
            onChange={(e) => setConfig({ ...config, conPersonaId: e.target.value || null })}
            className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 transition-all duration-300"
          >
            <option value="" className="bg-slate-950">Default Benchmarking Behavior</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id} className="bg-slate-950">
                {persona.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topic Selection */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Topic / Motion Selection
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTopicMode('random')
              setConfig({ ...config, topicSelection: 'random', topicId: undefined })
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              topicMode === 'random'
                ? 'bg-cyan-500/10 border border-cyan-500/35 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                : 'bg-slate-950/40 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            Random Selection
          </button>
          <button
            type="button"
            onClick={() => {
              setTopicMode('manual')
              setConfig({ ...config, topicSelection: 'manual' })
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              topicMode === 'manual'
                ? 'bg-cyan-500/10 border border-cyan-500/35 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                : 'bg-slate-950/40 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            Manual Selection
          </button>
        </div>

        {topicMode === 'manual' && (
          <div className="space-y-3 animate-fadeIn">
            <select
              value={config.topicId || ''}
              onChange={(e) => setConfig({ ...config, topicId: e.target.value || undefined })}
              className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300"
              required={topicMode === 'manual'}
            >
              <option value="" className="bg-slate-950">Select a curated topic motion...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id} className="bg-slate-950">
                  {topic.motion} [{topic.category} - {topic.difficulty}]
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRandomTopic}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-900 border border-white/5 text-slate-300 rounded-lg hover:border-cyan-500/20 hover:text-white transition-all"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Draw Random Curated Topic</span>
            </button>
          </div>
        )}

        {topicMode === 'random' && (
          <p className="text-xs text-slate-500 italic bg-slate-950/20 px-3 py-2 rounded-lg border border-white/5 inline-block">
            ℹ️ A random topic will be selected automatically from the active pool at graph initiation.
          </p>
        )}
      </div>

      {/* Debate Settings */}
      <div className="grid md:grid-cols-2 gap-5 pt-2">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Total Rounds
          </label>
          <select
            value={config.totalRounds}
            onChange={(e) => setConfig({ ...config, totalRounds: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 transition-all duration-300"
          >
            <option value={1} className="bg-slate-950">1 Round (Smoke Test)</option>
            <option value={2} className="bg-slate-950">2 Rounds</option>
            <option value={3} className="bg-slate-950">3 Rounds (Standard)</option>
            <option value={4} className="bg-slate-950">4 Rounds</option>
            <option value={5} className="bg-slate-950">5 Rounds (Deep Benchmark)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Fact-Checking Gate Mode
          </label>
          <select
            value={config.factCheckMode}
            onChange={(e) => setConfig({ ...config, factCheckMode: e.target.value as any })}
            className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 transition-all duration-300"
          >
            <option value="off" className="bg-slate-950">Off (Lightweight / Dry Runs)</option>
            <option value="standard" className="bg-slate-950">Standard (Claim source-checking)</option>
            <option value="strict" className="bg-slate-950">Strict (Rejects false claim drafts)</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4 text-sm tracking-wider uppercase"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Spawning LangGraph Session...</span>
          </>
        ) : (
          <span>Start Benchmarking Run</span>
        )}
      </button>
    </form>
  )
}


