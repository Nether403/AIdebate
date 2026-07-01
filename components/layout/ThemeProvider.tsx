'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Exactly two supported themes; dark is the default (Requirements 3.1, 3.2).
type Theme = 'light' | 'dark'

const DEFAULT_THEME: Theme = 'dark'
const STORAGE_KEY = 'theme'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: Theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function isSupportedTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

export interface ThemeResolution {
  /** The theme to apply on mount. */
  theme: Theme
  /** Whether the stored preference must be overwritten with `theme`. */
  persist: boolean
}

/**
 * Resolve the mount-time theme from a stored preference (Requirements 3.1, 3.2):
 * - a supported stored value ('light' | 'dark') is applied as-is (and so is
 *   reapplied on subsequent loads — Req 3.4)
 * - an absent or invalid stored value resolves to dark AND must overwrite the
 *   stored value with dark
 * Pure so the mount behavior is unit-testable without a DOM render harness.
 */
export function resolveStoredTheme(stored: string | null): ThemeResolution {
  if (isSupportedTheme(stored)) {
    return { theme: stored, persist: false }
  }
  return { theme: DEFAULT_THEME, persist: true }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)

  // Resolve the stored preference once on mount.
  // - No stored preference        → dark (Req 3.1)
  // - Stored value not dark/light  → dark AND overwrite the stored value (Req 3.2)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const { theme: resolved, persist } = resolveStoredTheme(stored)
    setTheme(resolved)
    if (persist) {
      localStorage.setItem(STORAGE_KEY, resolved)
    }
  }, [])

  // Apply the active theme to <html> and persist it. Runs on every change so the
  // selection takes effect without a page reload (Req 3.3) and persists (Req 3.4).
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
