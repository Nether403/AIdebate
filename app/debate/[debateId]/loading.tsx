import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route-level loading placeholder for the debate viewer.
 *
 * Reserves the same layout box the resolved transcript occupies (same max width,
 * padding, and block rhythm) so content resolving in causes no layout shift
 * (Req 11.5). The AppShell owns the sidebar/top bar/background.
 */
export default function DebateLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Motion banner box */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-6 backdrop-blur-sm">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
      {/* Transcript boxes */}
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
