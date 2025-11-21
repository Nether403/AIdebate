'use client'

import { useState, useEffect } from 'react'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { LeaderboardFilters } from '@/components/leaderboard/LeaderboardFilters'
import { LeaderboardStats } from '@/components/leaderboard/LeaderboardStats'

export interface LeaderboardEntry {
  rank: number
  modelId: string
  modelName: string
  provider: string
  ratings: {
    crowd: {
      rating: number
      deviation: number
    }
    aiQuality: {
      rating: number
      deviation: number
      volatility: string
    }
  }
  statistics: {
    totalDebates: number
    wins: number
    losses: number
    ties: number
    winRate: string
  }
  controversy: {
    index: number
    isControversial: boolean
  }
}

export interface LeaderboardFiltersState {
  sortBy: 'win_rate' | 'crowd_rating' | 'ai_quality_rating' | 'total_debates' | 'controversy_index'
  filterControversial: boolean
  providerFilter: string | null
  modelTypeFilter: 'all' | 'sota' | 'legacy'
  topicCategoryFilter: string | null
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<LeaderboardFiltersState>({
    sortBy: 'win_rate',
    filterControversial: false,
    providerFilter: null,
    modelTypeFilter: 'all',
    topicCategoryFilter: null,
  })
  const [topicCategories, setTopicCategories] = useState<string[]>([])

  useEffect(() => {
    fetchLeaderboard()
    fetchTopicCategories()
  }, [filters.sortBy, filters.filterControversial])

  const fetchTopicCategories = async () => {
    try {
      const response = await fetch('/api/topics/categories')
      const data = await response.json()
      if (response.ok) {
        setTopicCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch topic categories:', err)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        sortBy: filters.sortBy,
        filterControversial: filters.filterControversial.toString(),
        limit: '50',
      })

      const response = await fetch(`/api/leaderboard?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch leaderboard')
      }

      setLeaderboard(data.leaderboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Apply client-side filters
  const filteredLeaderboard = leaderboard.filter((entry) => {
    // Provider filter
    if (filters.providerFilter && entry.provider !== filters.providerFilter) {
      return false
    }

    // Model type filter (SOTA vs legacy)
    if (filters.modelTypeFilter !== 'all') {
      const isLegacy = entry.modelName.toLowerCase().includes('legacy') ||
                       entry.modelName.includes('3.5') ||
                       entry.modelName.includes('2.0') ||
                       entry.modelName.includes('2.1')
      
      if (filters.modelTypeFilter === 'legacy' && !isLegacy) {
        return false
      }
      if (filters.modelTypeFilter === 'sota' && isLegacy) {
        return false
      }
    }

    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Model Leaderboard</h1>
        <p className="text-muted-foreground">
          Compare LLM performance across debate quality metrics
        </p>
      </div>

      {/* Stats Overview */}
      <LeaderboardStats leaderboard={leaderboard} />

      {/* Filters */}
      <LeaderboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        providers={Array.from(new Set(leaderboard.map(e => e.provider)))}
        topicCategories={topicCategories}
      />

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-6">
          <p className="font-semibold">Error loading leaderboard</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Leaderboard Table */}
      {!loading && !error && (
        <LeaderboardTable
          entries={filteredLeaderboard}
          sortBy={filters.sortBy}
        />
      )}

      {/* Empty State */}
      {!loading && !error && filteredLeaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No models match the current filters
          </p>
        </div>
      )}
    </div>
  )
}
