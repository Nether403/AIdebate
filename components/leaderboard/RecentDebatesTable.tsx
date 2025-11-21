'use client'

import Link from 'next/link'
import { Trophy, X, Minus } from 'lucide-react'

interface Debate {
  id: string
  topicMotion: string
  opponent: string
  result: 'win' | 'loss' | 'tie'
  side: 'pro' | 'con'
  crowdVotes: number
  aiScore: number
  completedAt: string
}

interface RecentDebatesTableProps {
  debates: Debate[]
}

export function RecentDebatesTable({ debates }: RecentDebatesTableProps) {
  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win':
        return <Trophy className="w-4 h-4 text-green-500" />
      case 'loss':
        return <X className="w-4 h-4 text-red-500" />
      case 'tie':
        return <Minus className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  const getResultBadge = (result: string) => {
    const styles = {
      win: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      loss: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      tie: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return styles[result as keyof typeof styles] || styles.tie
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Result</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Topic</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Side</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Opponent</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Crowd Votes</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">AI Score</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {debates.map((debate) => (
              <tr key={debate.id} className="hover:bg-muted/30 transition-colors">
                {/* Result */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {getResultIcon(debate.result)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getResultBadge(
                        debate.result
                      )}`}
                    >
                      {debate.result.toUpperCase()}
                    </span>
                  </div>
                </td>

                {/* Topic */}
                <td className="px-4 py-4">
                  <div className="max-w-xs truncate" title={debate.topicMotion}>
                    {debate.topicMotion}
                  </div>
                </td>

                {/* Side */}
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      debate.side === 'pro'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}
                  >
                    {debate.side.toUpperCase()}
                  </span>
                </td>

                {/* Opponent */}
                <td className="px-4 py-4">
                  <div className="text-sm">{debate.opponent}</div>
                </td>

                {/* Crowd Votes */}
                <td className="px-4 py-4 text-center">
                  <span className="font-semibold">{debate.crowdVotes}</span>
                </td>

                {/* AI Score */}
                <td className="px-4 py-4 text-center">
                  <span className="font-semibold">{debate.aiScore}</span>
                </td>

                {/* Date */}
                <td className="px-4 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(debate.completedAt)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 text-center">
                  <Link
                    href={`/debate/${debate.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {debates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No recent debates
        </div>
      )}
    </div>
  )
}
