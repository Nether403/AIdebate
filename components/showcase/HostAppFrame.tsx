'use client'

import { ReactNode } from 'react'

interface HostAppFrameProps {
  appName: string
  appTagline?: string
  nav?: string[]
  activeNav?: string
  children: ReactNode
  accent?: string
}

/**
 * Mock chrome for a fictional host application. Wrapping an embedded demo in a
 * fake product shell makes the "this lives inside your app" point land visually
 * instead of relying on imagination.
 */
export function HostAppFrame({
  appName,
  appTagline,
  nav = ['Dashboard', 'Reports', 'Settings'],
  activeNav,
  children,
  accent = 'from-violet-500 to-fuchsia-500',
}: HostAppFrameProps) {
  const active = activeNav ?? nav[0]
  return (
    <div className="rounded-xl border border-slate-300/20 bg-slate-50 shadow-2xl overflow-hidden">
      {/* Fake browser bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 border-b border-slate-300">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 max-w-md">
          <div className="px-3 py-1 rounded-md bg-white text-xs text-slate-500 border border-slate-300">
            app.{appName.toLowerCase().replace(/\s+/g, '')}.example.com
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Host application</span>
      </div>

      <div className="flex min-h-[460px] bg-white text-slate-800">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border-r border-slate-200 bg-slate-100/70 p-4 hidden sm:block">
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accent}`} />
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">{appName}</p>
              {appTagline && <p className="text-[10px] text-slate-500">{appTagline}</p>}
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <div
                key={item}
                className={`px-3 py-2 rounded-md text-sm ${
                  item === active
                    ? 'bg-white font-medium text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500'
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content area where the embedded component lives */}
        <main className="flex-1 p-6 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
