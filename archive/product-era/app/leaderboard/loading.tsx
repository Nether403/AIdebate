import { Skeleton, LeaderboardRowSkeleton } from '@/components/layout/Skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Crowd Score</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">AI Quality</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Debates</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Win Rate</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Record</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <LeaderboardRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
