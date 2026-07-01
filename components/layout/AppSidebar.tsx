'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BRAND_IMAGES, NAV_ITEMS, type NavItem } from '@/lib/design-system/manifest'

/**
 * AppSidebar — persistent left navigation for the app shell.
 *
 * Renders the brand logo (with a soft cyan halo, linking home) and EXACTLY the
 * six approved research destinations sourced from the Navigation_Manifest
 * allow-list (`NAV_ITEMS`). Active state is derived from `usePathname()`.
 *
 * Honest-framing guarantee: every href comes from `NAV_ITEMS`, which the
 * manifest self-check + property suites prove are real routes that never match
 * the non-goal exclusion patterns. This component invents no destinations.
 *
 * Accessibility: 44×44 min hit targets, visible cyan focus ring (`--ring`),
 * fully keyboard operable (native links), informational logo alt (1–250 chars).
 *
 * Requirements: 2.2, 5.1, 6.4, 8.1, 9.3, 11.4
 */

// ponytail: index-independent lookup so a manifest reorder can't swap the asset.
const LOGO = BRAND_IMAGES.find((img) => img.src === '/logo.jpg') ?? BRAND_IMAGES[0]

interface AppSidebarProps {
  /** Defaults to NAV_ITEMS from the manifest; injectable for tests. */
  items?: NavItem[]
}

/** Active when the path equals the href or is nested beneath it. */
function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar({ items = NAV_ITEMS }: AppSidebarProps) {
  const pathname = usePathname() ?? '/'

  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-64 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground backdrop-blur-sm"
    >
      <Link
        href="/"
        aria-label="LLMargument workbench — home"
        className="group flex items-center gap-3 rounded-lg px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
      >
        <span className="relative inline-flex shrink-0 items-center justify-center">
          {/* soft cyan halo behind the mark */}
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[var(--glow-cyan)] blur-md"
          />
          <Image
            src={LOGO.src}
            alt={LOGO.alt}
            width={36}
            height={36}
            priority
            sizes="36px"
            className="rounded-lg ring-1 ring-cyan-400/30"
          />
        </span>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Debate Workbench
        </span>
      </Link>

      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                  active
                    ? 'bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/40'
                    : 'text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-sidebar-foreground'
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
