interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  return (
    <div
      className={`bg-slate-700/50 animate-pulse ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  )
}

export function DebateCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export function LeaderboardRowSkeleton() {
  return (
    <tr className="border-b border-slate-700">
      <td className="px-4 py-4">
        <Skeleton className="h-8 w-12" />
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-6 w-16 mx-auto" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-6 w-16 mx-auto" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-5 w-12 mx-auto" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-5 w-16 mx-auto" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-20 mx-auto" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24 mx-auto" />
      </td>
    </tr>
  )
}
