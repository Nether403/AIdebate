'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LeaderboardEntry } from '@/app/leaderboard/page'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  sortBy: string
}

export function LeaderboardTable({ entries, sortBy }: LeaderboardTableProps) {
  const getProviderBadgeColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      anthropic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      google: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      xai: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      openrouter: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return colors[provider.toLowerCase()] || colors.openrouter
  }

  const isLegacyModel = (modelName: string) => {
    return modelName.toLowerCase().includes('legacy') ||
           modelName.includes('3.5') ||
           modelName.includes('2.0') ||
           modelName.includes('2.1')
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Crowd Score
                <div className="text-xs font-normal text-muted-foreground">User Votes</div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                AI Quality
                <div className="text-xs font-normal text-muted-foreground">Judge Rating</div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Debates</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Win Rate</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Record</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry, index) => {
              const scoreDivergence = Math.abs(
                entry.ratings.crowd.rating - entry.ratings.aiQuality.rating
              )
              const isControversial = entry.controversy.isControversial

              return (
                <motion.tr
                  key={entry.modelId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`hover:bg-muted/30 transition-colors ${
                    isControversial ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{entry.rank}
                      </span>
                    </div>
                  </td>

                  {/* Model Name & Provider */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{entry.modelName}</span>
                        {isLegacyModel(entry.modelName) && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            Legacy
                          </span>
                        )}
                        {isControversial && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            ⚠️ Controversial
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full w-fit ${getProviderBadgeColor(
                          entry.provider
                        )}`}
                      >
                        {entry.provider}
                      </span>
                    </div>
                  </td>

                  {/* Crowd Score */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold">
                        {entry.ratings.crowd.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ±{entry.ratings.crowd.deviation}
                      </span>
                    </div>
                  </td>

                  {/* AI Quality Score */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold">
                        {entry.ratings.aiQuality.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ±{entry.ratings.aiQuality.deviation}
                      </span>
                      {isControversial && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Δ{scoreDivergence.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Total Debates */}
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold">
                      {entry.statistics.totalDebates}
                    </span>
                  </td>

                  {/* Win Rate */}
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {entry.statistics.winRate}
                    </span>
                  </td>

                  {/* Record (W-L-T) */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm text-muted-foreground">
                      {entry.statistics.wins}W-{entry.statistics.losses}L-
                      {entry.statistics.ties}T
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-center">
                    <Link
                      href={`/leaderboard/${entry.modelId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details →
                    </Link>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No models to display
        </div>
      )}
    </div>
  )
}
