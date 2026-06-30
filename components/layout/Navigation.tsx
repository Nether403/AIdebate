'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, FlaskConical, LayoutGrid } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Pitchdeck', icon: LayoutGrid },
    { href: '/debate/new', label: 'New Run', icon: Plus },
    { href: '/showcase', label: 'Showcase', icon: FlaskConical },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Branding */}
          <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
            <div className="relative w-10 h-10 flex items-center justify-center bg-slate-900/50 rounded-xl border border-white/10 overflow-visible group-hover:border-cyan-500/30 transition-all duration-300">
              {/* Pulsing glow background behind logo */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-amber-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* SVG Brain Constellation */}
              <svg viewBox="0 0 100 100" className="w-8 h-8 relative z-10 filter drop-shadow-[0_0_8px_rgba(0,242,254,0.3)]">
                {/* Connections */}
                <path 
                  d="M32,35 L48,28 L64,32 L75,44 L78,57 M78,57 L68,69 L53,74 L38,69 M38,69 L28,57 L28,44 L32,35 
                     M48,28 L51,46 L53,74 M32,35 L42,48 L51,46 M64,32 L56,48 L51,46 M28,44 L42,48 M75,44 L56,48 
                     M28,57 L44,60 M78,57 L58,60 M44,60 L51,46 M58,60 L51,46 M53,74 L51,85 M51,85 L56,88 L58,82 M51,46 L58,60" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.25)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                />
                {/* Glowing Nodes (styled with custom colors) */}
                {/* Left/Amber */}
                <circle cx="28" cy="44" r="3.5" className="fill-amber-400 animate-pulse" />
                <circle cx="32" cy="35" r="3.5" className="fill-orange-400" />
                <circle cx="28" cy="57" r="3" className="fill-amber-500 animate-pulse" />
                {/* Top/Violet */}
                <circle cx="48" cy="28" r="4" className="fill-white" />
                <circle cx="51" cy="46" r="4.5" className="fill-purple-400 animate-pulse" style={{ animationDuration: '3s' }} />
                {/* Right/Cyan */}
                <circle cx="64" cy="32" r="3.5" className="fill-cyan-300" />
                <circle cx="75" cy="44" r="3.5" className="fill-cyan-400 animate-pulse" />
                <circle cx="78" cy="57" r="3.5" className="fill-teal-400" />
                <circle cx="68" cy="69" r="3" className="fill-cyan-500 animate-pulse" />
                {/* Bottom details */}
                <circle cx="42" cy="48" r="3" className="fill-indigo-300" />
                <circle cx="56" cy="48" r="3" className="fill-purple-300" />
                <circle cx="44" cy="60" r="3" className="fill-indigo-400" />
                <circle cx="58" cy="60" r="3" className="fill-purple-500" />
                <circle cx="38" cy="69" r="3.5" className="fill-pink-500" />
                <circle cx="53" cy="74" r="3.5" className="fill-cyan-400 animate-pulse" />
                <circle cx="51" cy="85" r="2.5" className="fill-cyan-600" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight text-lg leading-none group-hover:text-cyan-400 transition-colors duration-300">
                llmargument
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest leading-none mt-1">
                AI Debate Arena
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  title={link.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
            <div className="h-6 w-px bg-white/10 mx-1" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
