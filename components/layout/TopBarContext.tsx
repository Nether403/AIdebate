'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AppTopBarProps } from './AppTopBar'

/** Page-settable top bar config (everything AppTopBar needs except the AppShell-owned menu slot). */
export type TopBarConfig = Omit<AppTopBarProps, 'menuSlot'>

interface TopBarContextValue {
  config: TopBarConfig | null
  setConfig: (config: TopBarConfig | null) => void
}

const TopBarContext = createContext<TopBarContextValue | undefined>(undefined)

/**
 * Provider mounted by AppShell (task 2.4). Holds the active top bar config so pages can set
 * the breadcrumb/context/action declaratively without prop-drilling through the shell.
 */
export function TopBarProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<TopBarConfig | null>(null)
  const value = useMemo(() => ({ config, setConfig }), [config])
  return <TopBarContext.Provider value={value}>{children}</TopBarContext.Provider>
}

/** Read the current top bar config. Used by AppShell to feed AppTopBar. */
export function useTopBarConfig(): TopBarConfig | null {
  const ctx = useContext(TopBarContext)
  if (ctx === undefined) {
    throw new Error('useTopBarConfig must be used within a TopBarProvider')
  }
  return ctx.config
}

/**
 * Set the shell's top bar from a page. Applies the config on mount and clears it on unmount.
 *
 * ponytail: re-fires when the breadcrumb/contextPill/primaryAction *values* change, compared
 * via JSON. A `primaryAction.onClick` closure is not part of that comparison (functions don't
 * serialize) — the closure captured at the last value-change is used, which is correct for
 * handlers that don't depend on changing identity. Pass a stable handler if that matters.
 */
export function useTopBar(config: TopBarConfig): void {
  const ctx = useContext(TopBarContext)
  if (ctx === undefined) {
    throw new Error('useTopBar must be used within a TopBarProvider')
  }
  const { setConfig } = ctx
  const serialized = JSON.stringify(config)

  useEffect(() => {
    setConfig(config)
    return () => setConfig(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, setConfig])
}
