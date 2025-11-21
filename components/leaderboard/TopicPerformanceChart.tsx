'use client'

interface TopicPerformance {
  category: string
  debates: number
  wins: number
  losses: number
  ties: number
  winRate: number
}

interface TopicPerformanceChartProps {
  performance: TopicPerformance[]
}

export function TopicPerformanceChart({ performance }: TopicPerformanceChartProps) {
  // Sort by win rate descending
  const sortedPerformance = [...performance].sort((a, b) => b.winRate - a.winRate)

  const maxDebates = Math.max(...performance.map((p) => p.debates))

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="space-y-4">
        {sortedPerformance.map((topic) => {
          const winRatePercent = (topic.winRate * 100).toFixed(1)
          const barWidth = (topic.debates / maxDebates) * 100

          return (
            <div key={topic.category} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold capitalize">{topic.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {topic.debates} debates
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {winRatePercent}% win rate
                  </span>
                  <span className="text-muted-foreground">
                    {topic.wins}W-{topic.losses}L-{topic.ties}T
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                {/* Win portion */}
                <div
                  className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                  style={{ width: `${(topic.wins / topic.debates) * 100}%` }}
                />
                {/* Loss portion */}
                <div
                  className="absolute top-0 h-full bg-red-500 transition-all"
                  style={{
                    left: `${(topic.wins / topic.debates) * 100}%`,
                    width: `${(topic.losses / topic.debates) * 100}%`,
                  }}
                />
                {/* Tie portion */}
                <div
                  className="absolute top-0 h-full bg-gray-400 transition-all"
                  style={{
                    left: `${((topic.wins + topic.losses) / topic.debates) * 100}%`,
                    width: `${(topic.ties / topic.debates) * 100}%`,
                  }}
                />

                {/* Labels */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white drop-shadow-md">
                    {topic.wins > 0 && `${topic.wins}W`}
                    {topic.losses > 0 && ` ${topic.losses}L`}
                    {topic.ties > 0 && ` ${topic.ties}T`}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Wins</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Losses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Ties</span>
        </div>
      </div>
    </div>
  )
}
