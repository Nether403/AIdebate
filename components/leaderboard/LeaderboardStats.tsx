'use client'

import { LeaderboardEntry } from '@/app/leaderboard/page'

interface LeaderboardStatsProps {
  leaderboard: LeaderboardEntry[]
}

export function LeaderboardStats({ leaderboard }: LeaderboardStatsProps) {
  if (leaderboard.length === 0) {
    return null
  }

  const totalDebates = leaderboard.reduce(
    (sum, entry) => sum + entry.statistics.totalDebates,
    0
  )

  const controversialCount = leaderboard.filter(
    (entry) => entry.controversy.isControversial
  ).length

  const avgCrowdScore =
    leaderboard.reduce((sum, entry) => sum + entry.ratings.crowd.rating, 0) /
    leaderboard.length

  const avgAiScore =
    leaderboard.reduce((sum, entry) => sum + entry.ratings.aiQuality.rating, 0) /
    leaderboard.length

  const topModel = leaderboard[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Models */}
      <div className="bg-card rounded-lg border p-4">
        <div className="text-sm text-muted-foreground mb-1">Total Models</div>
        <div className="text-3xl font-bold">{leaderboard.length}</div>
      </div>

      {/* Total Debates */}
      <div className="bg-card rounded-lg border p-4">
        <div className="text-sm text-muted-foreground mb-1">Total Debates</div>
        <div className="text-3xl font-bold">{totalDebates.toLocaleString()}</div>
      </div>

      {/* Avg Crowd Score */}
      <div className="bg-card rounded-lg border p-4">
        <div className="text-sm text-muted-foreground mb-1">Avg Crowd Score</div>
        <div className="text-3xl font-bold">{Math.round(avgCrowdScore)}</div>
      </div>

      {/* Avg AI Score */}
      <div className="bg-card rounded-lg border p-4">
        <div className="text-sm text-muted-foreground mb-1">Avg AI Quality</div>
        <div className="text-3xl font-bold">{Math.round(avgAiScore)}</div>
      </div>

      {/* Controversial Models */}
      <div className="bg-card rounded-lg border p-4">
        <div className="text-sm text-muted-foreground mb-1">Controversial</div>
        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
          {controversialCount}
        </div>
      </div>

      {/* Top Model Highlight */}
      {topModel && (
        <div className="md:col-span-2 lg:col-span-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                🏆 Current Leader
              </div>
              <div className="text-2xl font-bold">{topModel.modelName}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {topModel.provider} • Win Rate: {topModel.statistics.winRate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Scores</div>
              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Crowd</div>
                  <div className="text-xl font-bold">
                    {topModel.ratings.crowd.rating}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">AI Quality</div>
                  <div className="text-xl font-bold">
                    {topModel.ratings.aiQuality.rating}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
