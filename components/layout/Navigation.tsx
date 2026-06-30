'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/design-system/manifest'
import { BrandLogo } from '@/components/showcase/BrandLogo'
import { ThemeToggle } from './ThemeToggle'

/**
 * Navigation_Shell — exposes ONLY the six approved research destinations
 * (Requirement 6.4) by mapping over `NAV_ITEMS` from the Design_System
 * manifest. Each item renders as a real `next/link` to a resolvable route
 * (Requirements 5.2, 5.3); no gamification / prediction-market / social
 * destination is present or reachable (Requirements 6.2, 6.3).
 *
 * The brand logo is the persistent anchor (Requirement 2.2) and links home.
 * Links, the menu toggle, and controls meet the 44×44 CSS-px minimum target
 * (Requirement 7.6) and expose a visible focus ring (Requirement 8.4). Colors
 * come from theme-scoped Design_System tokens only (Requirement 10.2). On
 * narrow viewports the six labels collapse behind a menu toggle so nothing
 * overflows the viewport (Requirement 7.1).
 */
export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const linkClasses = (href: string) => {
    const isActive = pathname === href
    return (
      'inline-flex items-center min-h-11 px-[var(--space-md)] rounded-pill text-caption font-medium ' +
      'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
      (isActive
        ? 'bg-accent-primary/10 text-accent-primary'
        : 'text-text-muted hover:text-text hover:bg-surface-raised')
    )
  }

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel">
      <div className="max-w-7xl mx-auto px-[var(--space-md)] sm:px-[var(--space-lg)]">
        <div className="flex items-center justify-between h-16 gap-[var(--space-md)]">
          {/* Brand anchor (Requirement 2.2) */}
          <Link
            href="/"
            className="flex items-center min-h-11 gap-[var(--space-sm)] shrink-0 rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <BrandLogo size={36} priority />
            <span className="flex flex-col leading-none">
              <span className="text-text font-bold tracking-tight text-body">llmargument</span>
              <span className="text-text-muted uppercase tracking-widest text-caption mt-1">
                AI Debate Arena
              </span>
            </span>
          </Link>

          {/* Desktop destinations — the six NAV_ITEMS only */}
          <div className="hidden lg:flex items-center gap-[var(--space-xs)]">
            {NAV_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} className={linkClasses(item.href)}>
                {item.label}
              </Link>
            ))}
            <span className="h-6 w-px bg-border mx-[var(--space-xs)]" aria-hidden="true" />
            <ThemeToggle />
          </div>

          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-[var(--space-xs)]">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls="primary-navigation"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-pill text-text-muted hover:text-text hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel — the six NAV_ITEMS only */}
        {isOpen && (
          <div
            id="primary-navigation"
            className="lg:hidden flex flex-col gap-[var(--space-xs)] pb-[var(--space-md)]"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={linkClasses(item.href) + ' w-full'}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
