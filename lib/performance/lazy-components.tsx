import dynamic from 'next/dynamic'

// Lazy load heavy components
export const DebateTranscript = dynamic(
  () => import('@/components/debate/DebateTranscript').then((mod) => ({ default: mod.DebateTranscript })),
  {
    loading: () => (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-lg border border-slate-700 p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    ),
  }
)

export const ProbabilityGraph = dynamic(
  () => import('@/components/debate/ProbabilityGraph').then((mod) => ({ default: mod.ProbabilityGraph })),
  {
    loading: () => (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="h-64 bg-slate-700 rounded animate-pulse"></div>
      </div>
    ),
  }
)
