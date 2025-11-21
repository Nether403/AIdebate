'use client'

import { useState, useEffect } from 'react'
import { Shuffle } from 'lucide-react'
import type { Model, Topic, Persona } from '@/types'

interface DebateConfigFormProps {
  onSubmit: (config: DebateConfig) => void
  isLoading?: boolean
}

export interface DebateConfig {
  proModelId: string
  conModelId: string
  topicId: string | null
  proPersonaId: string | null
  conPersonaId: string | null
  totalRounds: number
  factCheckMode: 'off' | 'standard' | 'strict'
}

export function DebateConfigForm({ onSubmit, isLoading = false }: DebateConfigFormProps) {
  const [models, setModels] = useState<Model[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  
  const [config, setConfig] = useState<DebateConfig>({
    proModelId: '',
    conModelId: '',
    topicId: null,
    proPersonaId: null,
    conPersonaId: null,
    totalRounds: 3,
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
    
    // Validation
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

    onSubmit(config)
  }

  if (loadingData) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-6">
      <h2 className="text-2xl font-bold text-white">Configure Debate</h2>

      {/* Model Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Pro Model
          </label>
          <select
            value={config.proModelId}
            onChange={(e) => setConfig({ ...config, proModelId: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a model...</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Con Model
          </label>
          <select
            value={config.conModelId}
            onChange={(e) => setConfig({ ...config, conModelId: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a model...</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Persona Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Pro Persona (Optional)
          </label>
          <select
            value={config.proPersonaId || ''}
            onChange={(e) => setConfig({ ...config, proPersonaId: e.target.value || null })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No persona</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Con Persona (Optional)
          </label>
          <select
            value={config.conPersonaId || ''}
            onChange={(e) => setConfig({ ...config, conPersonaId: e.target.value || null })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No persona</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topic Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Topic Selection
        </label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setTopicMode('random')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              topicMode === 'random'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Random
          </button>
          <button
            type="button"
            onClick={() => setTopicMode('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              topicMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Manual
          </button>
        </div>

        {topicMode === 'manual' && (
          <div className="space-y-2">
            <select
              value={config.topicId || ''}
              onChange={(e) => setConfig({ ...config, topicId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={topicMode === 'manual'}
            >
              <option value="">Select a topic...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.motion} ({topic.category} - {topic.difficulty})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRandomTopic}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Pick Random
            </button>
          </div>
        )}

        {topicMode === 'random' && (
          <p className="text-sm text-slate-400 italic">
            A random topic will be selected when the debate starts
          </p>
        )}
      </div>

      {/* Debate Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of Rounds
          </label>
          <select
            value={config.totalRounds}
            onChange={(e) => setConfig({ ...config, totalRounds: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 Round</option>
            <option value={2}>2 Rounds</option>
            <option value={3}>3 Rounds</option>
            <option value={4}>4 Rounds</option>
            <option value={5}>5 Rounds</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Fact-Checking Mode
          </label>
          <select
            value={config.factCheckMode}
            onChange={(e) => setConfig({ ...config, factCheckMode: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="off">Off</option>
            <option value="standard">Standard</option>
            <option value="strict">Strict (Rejects false claims)</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Starting Debate...' : 'Start Debate'}
      </button>
    </form>
  )
}
