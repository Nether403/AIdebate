'use client'

import { useTopBar, type TopBarConfig } from './TopBarContext'

/**
 * Thin client bridge that lets a server-component page set the shell top bar
 * declaratively without becoming a client component itself (so the page keeps
 * its `metadata` export). Renders nothing; just applies the config via
 * `useTopBar` for the lifetime of the page.
 *
 * Props must be serializable (breadcrumb/contextPill/primaryAction with an href).
 * For an `onClick` primary action, call `useTopBar` from a client page instead.
 */
export function SetTopBar(config: TopBarConfig): null {
  useTopBar(config)
  return null
}
