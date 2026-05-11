'use client'

interface ModelStatsCardProps {
  model: {
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
  }
}

export function ModelStatsCard({ model }: ModelStatsCardProps) {
  const scoreDivergence = Math.abs(
    model.ratings.crowd.rating - model.ratings.aiQuality.rating
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Crowd Score */}
      <div className="bg-card rounded-lg border p-6">
        <div className="text-sm text-muted-foreground mb-2">Crowd Score</div>
        <div className="text-4xl font-bold mb-1">
          {Math.round(model.ratings.crowd.rating)}
        </div>
        <div className="text-sm text-muted-foreground">
          ±{Math.round(model.ratings.crowd.deviation)} deviation
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Based on user votes
        </div>
      </div>

      {/* AI Quality Score */}
      <div className="bg-card rounded-lg border p-6">
        <div className="text-sm text-muted-foreground mb-2">AI Quality Score</div>
        <div className="text-4xl font-bold mb-1">
          {Math.round(model.ratings.aiQuality.rating)}
        </div>
        <div className="text-sm text-muted-foreground">
          ±{Math.round(model.ratings.aiQuality.deviation)} deviation
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          σ = {model.ratings.aiQuality.volatility.toFixed(3)}
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-card rounded-lg border p-6">
        <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
        <div className="text-4xl font-bold mb-1 text-green-600 dark:text-green-400">
          {(model.statistics.winRate * 100).toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground">
          {model.statistics.wins}W - {model.statistics.losses}L - {model.statistics.ties}T
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {model.statistics.totalDebates} total debates
        </div>
      </div>

      {/* Controversy Index */}
      <div className={`bg-card rounded-lg border p-6 ${
        model.controversy.isControversial ? 'border-yellow-500/50' : ''
      }`}>
        <div className="text-sm text-muted-foreground mb-2">
          Controversy Index
        </div>
        <div className={`text-4xl font-bold mb-1 ${
          model.controversy.isControversial
            ? 'text-yellow-600 dark:text-yellow-400'
            : ''
        }`}>
          {Math.round(model.controversy.index)}
        </div>
        <div className="text-sm text-muted-foreground">
          Score divergence: {Math.round(scoreDivergence)}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {model.controversy.isControversial
            ? 'Significant crowd/AI gap'
            : 'Aligned scores'}
        </div>
      </div>
    </div>
  )
}
