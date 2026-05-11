'use client'

interface RatingHistory {
  date: string
  crowdRating: number
  aiQualityRating: number
}

interface ProgressChartProps {
  history: RatingHistory[]
}

export function ProgressChart({ history }: ProgressChartProps) {
  if (history.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center text-muted-foreground">
        No rating history available
      </div>
    )
  }

  // Calculate chart dimensions
  const minRating = Math.min(
    ...history.map((h) => Math.min(h.crowdRating, h.aiQualityRating))
  )
  const maxRating = Math.max(
    ...history.map((h) => Math.max(h.crowdRating, h.aiQualityRating))
  )
  const ratingRange = maxRating - minRating
  const padding = ratingRange * 0.1 // 10% padding
  const chartMin = Math.floor(minRating - padding)
  const chartMax = Math.ceil(maxRating + padding)
  const chartRange = chartMax - chartMin

  const getYPosition = (rating: number) => {
    return ((chartMax - rating) / chartRange) * 100
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Generate SVG path for line chart
  const generatePath = (data: number[]) => {
    const points = data.map((rating, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = getYPosition(rating)
      return `${x},${y}`
    })
    return `M ${points.join(' L ')}`
  }

  const crowdPath = generatePath(history.map((h) => h.crowdRating))
  const aiPath = generatePath(history.map((h) => h.aiQualityRating))

  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Chart */}
      <div className="relative h-64 mb-4">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              strokeWidth="0.1"
              className="text-muted-foreground/20"
            />
          ))}

          {/* Crowd rating line */}
          <path
            d={crowdPath}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* AI quality rating line */}
          <path
            d={aiPath}
            fill="none"
            stroke="rgb(168, 85, 247)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {history.map((point, index) => {
            const x = (index / (history.length - 1)) * 100
            const crowdY = getYPosition(point.crowdRating)
            const aiY = getYPosition(point.aiQualityRating)

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={crowdY}
                  r="0.8"
                  fill="rgb(59, 130, 246)"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={x}
                  cy={aiY}
                  r="0.8"
                  fill="rgb(168, 85, 247)"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground -ml-12">
          <span>{chartMax}</span>
          <span>{Math.round((chartMax + chartMin) / 2)}</span>
          <span>{chartMin}</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        {history.map((point, index) => {
          // Show only first, last, and some middle points
          if (
            index === 0 ||
            index === history.length - 1 ||
            index % Math.ceil(history.length / 5) === 0
          ) {
            return <span key={index}>{formatDate(point.date)}</span>
          }
          return null
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <span>Crowd Rating</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-purple-500 rounded"></div>
          <span>AI Quality Rating</span>
        </div>
      </div>

      {/* Current values */}
      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Current Crowd</div>
          <div className="text-2xl font-bold text-blue-500">
            {Math.round(history[history.length - 1].crowdRating)}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Current AI Quality</div>
          <div className="text-2xl font-bold text-purple-500">
            {Math.round(history[history.length - 1].aiQualityRating)}
          </div>
        </div>
      </div>
    </div>
  )
}
