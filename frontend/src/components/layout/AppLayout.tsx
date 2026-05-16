import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Zap, Code2, History, Brain, BarChart3, PlayCircle,
  Settings, GitBranch, ChevronLeft, ChevronRight, Activity,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { path: '/', icon: Zap, label: 'Home' },
  { path: '/repair', icon: Code2, label: 'Repair' },
  { path: '/runs', icon: History, label: 'History' },
  { path: '/memory', icon: Brain, label: 'Memory' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/demo-cases', icon: PlayCircle, label: 'Demo Cases' },
  { path: '/architecture', icon: GitBranch, label: 'Architecture' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-bg-secondary border-r border-border-default transition-all duration-200',
          collapsed ? 'w-14' : 'w-56',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-border-default">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center flex-shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sm text-text-primary whitespace-nowrap">
                AutoPatch AI
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-border-default text-text-secondary hover:text-text-primary"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
