'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  href?: string
}

export interface AppTopBarProps {
  breadcrumb: Crumb[]
  /** Small contextual metric pill, e.g. "240 debates". Rendered only when provided. */
  contextPill?: string
  /** Optional primary action (label + href OR onClick). Renders as a gradient button. */
  primaryAction?: { label: string; href?: string; onClick?: () => void }
  /**
   * Slot for the mobile sidebar-disclosure toggle. AppShell injects its disclosure
   * control here (task 2.4); the top bar itself owns no drawer state.
   */
  menuSlot?: React.ReactNode
}

// Shared focus-ring + min-target treatment for interactive controls.
const interactive =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/**
 * Sticky top bar: translucent backdrop-blur surface with a hairline bottom border.
 * Always renders the breadcrumb and ThemeToggle; the context pill and primary-action
 * slot render only when their values are provided.
 */
export function AppTopBar({ breadcrumb, contextPill, primaryAction, menuSlot }: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-[var(--sidebar)] px-4 backdrop-blur-md sm:px-6">
      {menuSlot}

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {breadcrumb.map((crumb, i) => {
            const isLast = i === breadcrumb.length - 1
            return (
              <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className={cn(
                      'truncate rounded-sm text-muted-foreground transition-colors hover:text-foreground',
                      interactive
                    )}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn('truncate', isLast ? 'font-medium text-foreground' : 'text-muted-foreground')}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {contextPill && (
        <span className="hidden shrink-0 items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
          {contextPill}
        </span>
      )}

      {primaryAction && <PrimaryAction action={primaryAction} />}

      <ThemeToggle />
    </header>
  )
}

function PrimaryAction({ action }: { action: NonNullable<AppTopBarProps['primaryAction']> }) {
  const className = cn(
    'inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-opacity hover:opacity-90',
    interactive
  )
  // Gradient identity from the single approved accent token.
  const style = { backgroundImage: 'var(--accent-gradient)' }

  if (action.href) {
    return (
      <Link href={action.href} className={className} style={style}>
        {action.label}
      </Link>
    )
  }
  return (
    <button type="button" onClick={action.onClick} className={className} style={style}>
      {action.label}
    </button>
  )
}
