'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AmbientGlow } from './AmbientGlow'
import { AppSidebar } from './AppSidebar'
import { AppTopBar } from './AppTopBar'
import { TopBarProvider, useTopBarConfig, type TopBarConfig } from './TopBarContext'
import { cn } from '@/lib/utils'

/**
 * AppShell — the single persistent shell wrapping every route.
 *
 * Layers (see design "Layered visual model"):
 *  - z0  AmbientGlow (fixed, decorative) — mounted here and ONLY here.
 *  - z10 AppSidebar + main column { AppTopBar, children } over the glow.
 *
 * Owns the themed base surface (`bg-background` — the cool near-black `#070b11`
 * in the dark theme, `#f8fafc` in light) and the `font-sans antialiased` root. Pages render only their own content and set the top bar declaratively
 * via `useTopBar` (read back here through `useTopBarConfig`).
 *
 * Responsive (lg = 1024px):
 *  - below lg: sidebar is hidden off-canvas; a disclosure toggle appears in the
 *    top bar; the main column is full width.
 *  - at/above lg: persistent sidebar column; no toggle.
 *
 * Disclosure: the toggle opens an off-canvas drawer and moves focus into it;
 * dismissing it (Escape, overlay click, close button, or following a nav link)
 * closes the drawer and returns focus to the toggle. Focus is moved in but NOT
 * trapped (Req 9.6 / 10.6).
 *
 * Requirements: 2.1, 10.1, 10.2, 10.5, 10.6
 */

interface AppShellProps {
  children: React.ReactNode
}

const DEFAULT_TOPBAR: TopBarConfig = { breadcrumb: [{ label: 'Workbench' }] }

export function AppShell({ children }: AppShellProps) {
  return (
    <TopBarProvider>
      <ShellFrame>{children}</ShellFrame>
    </TopBarProvider>
  )
}

/** Inner frame: lives under TopBarProvider so it can read the page-set top bar config. */
function ShellFrame({ children }: AppShellProps) {
  const config = useTopBarConfig() ?? DEFAULT_TOPBAR
  const [open, setOpen] = useState(false)

  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)

  // Move focus into the drawer on open; return it to the toggle on close.
  // No focus trap — focus can leave the drawer freely (Req 10.6 / 9.6).
  useEffect(() => {
    if (open) {
      panelRef.current?.focus()
    } else if (wasOpen.current) {
      toggleRef.current?.focus()
    }
    wasOpen.current = open
  }, [open])

  // Escape dismisses the open drawer.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Following a nav link inside the drawer also dismisses it.
  const handlePanelClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false)
  }

  const toggle = (
    <button
      ref={toggleRef}
      type="button"
      aria-label="Open navigation"
      aria-controls="app-sidebar-drawer"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground lg:hidden',
        'transition-colors hover:bg-white/[0.06]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <Menu className="h-5 w-5" aria-hidden />
    </button>
  )

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground antialiased">
      <AmbientGlow />

      <div className="relative z-10 flex min-h-screen">
        {/* Persistent sidebar column — at/above lg only. */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        {/* Main column: top bar + page content, full width below lg. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopBar {...config} menuSlot={toggle} />
          <main className="flex-1">{children}</main>
        </div>
      </div>

      {/* Off-canvas drawer — below lg only. */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            id="app-sidebar-drawer"
            role="dialog"
            aria-modal="false"
            aria-label="Navigation"
            tabIndex={-1}
            onClick={handlePanelClick}
            className="absolute inset-y-0 left-0 flex h-full outline-none"
          >
            <AppSidebar />
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className={cn(
                'absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-lg text-sidebar-foreground',
                'transition-colors hover:bg-white/[0.06]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar'
              )}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
