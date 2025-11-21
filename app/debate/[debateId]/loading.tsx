import { LoadingSpinner } from '@/components/layout/LoadingSpinner'

export default function DebateLoading() {
  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading debate..." />
        </div>
      </div>
    </div>
  )
}
