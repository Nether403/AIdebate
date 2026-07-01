import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route-level loading placeholder for the create-run screen.
 *
 * Reserves the configuration form's layout box (same max width, padding, and the
 * stacked field rhythm) so the resolved form causes no layout shift (Req 11.5).
 */
export default function NewDebateLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="space-y-6 rounded-xl border border-border bg-card p-6 backdrop-blur-sm">
        <Skeleton className="h-5 w-44" />
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-16" />
      </div>
    </div>
  )
}
