'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ModelStatsCard } from '@/components/leaderboard/ModelStatsCard'
import { RecentDebatesTable } from '@/components/leaderboard/RecentDebatesTable'
import { TopicPerformanceChart } from '@/components/leaderboard/TopicPerformanceChart'
import { ProgressChart } from '@/components/leaderboard/ProgressChart'

interface ModelDetails {
  modelId: string
  modelName: string
  provider: string
  isActive: boolean
  ratings: {
    crowd: {
      rating: number
      deviation: number
    }
    aiQuality: {
      rating: number
      deviation: number
      volatility: number
    }
  }
  statistics: {
    totalDebates: number
    wins: number
    losses: number
    ties: number
    winRate: number
  }
  controversy: {
    index: number
    isControversial: boolean
  }
  recentDebates: Array<{
    id: string
    topicMotion: string
    opponent: string
    result: 'win' | 'loss' | 'tie'
    side: 'pro' | 'con'
    crowdVotes: number
    aiScore: number
    completedAt: string
  }>
  topicPerformance: Array<{
    category: string
    debates: number
    wins: number
    losses: number
    ties: number
    winRate: number
  }>
  ratingHistory: Array<{
    date: string
    crowdRating: number
    aiQualityRating: number
  }>
}

export default function ModelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const modelId = params.modelId as string

  const [model, setModel] = useState<ModelDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchModelDetails()
  }, [modelId])

  const fetchModelDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/leaderboard/${modelId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch model details')
      }

      setModel(data.model)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          <p className="font-semibold">Error loading model details</p>
          <p className="text-sm">{error || 'Model not found'}</p>
          <Link href="/leaderboard" className="mt-2 text-sm underline hover:no-underline inline-block">
            ← Back to Leaderboard
          </Link>
        </div>
      </div>
    )
  }

  const getTrendIcon = () => {
    if (model.ratingHistory.length < 2) return <Minus className="w-4 h-4" />
    
    const recent = model.ratingHistory[model.ratingHistory.length - 1]
    const previous = model.ratingHistory[model.ratingHistory.length - 2]
    
    if (recent.crowdRating > previous.crowdRating) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (recent.crowdRating < previous.crowdRating) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{model.modelName}</h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {model.provider}
              </span>
              {model.controversy.isControversial && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm font-medium">
                  ⚠️ Controversial
                </span>
              )}
              {!model.isActive && (
                <span className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                  Inactive
                </span>
              )}
              {getTrendIcon()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <ModelStatsCard model={model} />

      {/* Progress Chart */}
      {model.ratingHistory.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Rating Progress</h2>
          <ProgressChart history={model.ratingHistory} />
        </div>
      )}

      {/* Topic Performance */}
      {model.topicPerformance.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Performance by Topic</h2>
          <TopicPerformanceChart performance={model.topicPerformance} />
        </div>
      )}

      {/* Recent Debates */}
      {model.recentDebates.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Recent Debates</h2>
          <RecentDebatesTable debates={model.recentDebates} />
        </div>
      )}

      {/* Empty State */}
      {model.statistics.totalDebates === 0 && (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">
            This model hasn't participated in any debates yet.
          </p>
        </div>
      )}
    </div>
  )
}
