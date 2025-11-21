'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Plus, BookOpen } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/debate/new', label: 'New Debate', icon: Plus },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/debate/example', label: 'Example', icon: BookOpen },
  ]

  // Add showcase link in development
  if (process.env.NODE_ENV === 'development') {
    links.push({ href: '/components-showcase', label: 'Components', icon: BookOpen })
  }

  return (
    <nav className="border-b border-slate-700 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/75 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">AI</span>
            </div>
            <span className="text-white font-semibold text-base sm:text-lg hidden xs:block">
              Debate Arena
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                  title={link.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              )
            })}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
