import React from 'react'
import { cn, confidenceColor, confidenceBg } from '../../lib/utils'

// Status Badge
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: 'bg-green-900/30 text-accent-green border-green-800/40',
    RUNNING: 'bg-blue-900/30 text-accent-blue border-blue-800/40',
    QUEUED: 'bg-yellow-900/30 text-accent-yellow border-yellow-800/40',
    FAILED: 'bg-red-900/30 text-accent-red border-red-800/40',
    TIMEOUT: 'bg-orange-900/30 text-accent-orange border-orange-800/40',
  }
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', colors[status] || 'bg-bg-tertiary text-text-secondary border-border-default')}>
      {status}
    </span>
  )
}

// Language Badge
export function LanguageBadge({ language }: { language: string }) {
  const py = language === 'PYTHON'
  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded border font-mono font-medium',
      py ? 'bg-blue-900/20 text-accent-blue border-blue-800/30' : 'bg-orange-900/20 text-accent-orange border-orange-800/30',
    )}>
      {py ? '🐍 Python' : '☕ Java'}
    </span>
  )
}

// Confidence Meter
export function ConfidenceMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', confidenceBg(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono font-medium min-w-[2.5rem]', confidenceColor(score))}>
        {pct}%
      </span>
    </div>
  )
}

// Card
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-bg-card border border-border-default rounded-lg', className)}>
      {children}
    </div>
  )
}

// Loading skeleton
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded', className)} />
}

// Empty state
export function EmptyState({ icon, title, description }: {
  icon: React.ReactNode; title: string; description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-text-muted mb-3">{icon}</div>
      <h3 className="text-sm font-medium text-text-secondary mb-1">{title}</h3>
      {description && <p className="text-xs text-text-muted max-w-xs">{description}</p>}
    </div>
  )
}

// Agent node step indicator
const NODE_ORDER = ['TestRunner', 'ErrorAnalyzer', 'KnowledgeRetriever', 'CodeFixer', 'Judge', 'MemoryWriter']
const NODE_LABELS: Record<string, string> = {
  TestRunner: 'Test Runner',
  ErrorAnalyzer: 'Error Analyzer',
  KnowledgeRetriever: 'Knowledge Retriever',
  CodeFixer: 'Code Fixer',
  Judge: 'Judge',
  MemoryWriter: 'Memory Writer',
}

export function AgentStepper({ currentNode, completedNodes }: {
  currentNode: string | null
  completedNodes: string[]
}) {
  return (
    <div className="space-y-1">
      {NODE_ORDER.map((node) => {
        const isActive = currentNode === node
        const isDone = completedNodes.includes(node)
        return (
          <div key={node} className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-colors',
            isActive && 'bg-blue-900/20 border border-blue-800/30',
            isDone && 'opacity-60',
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              isActive && 'bg-accent-blue pulse-dot',
              isDone && 'bg-accent-green',
              !isActive && !isDone && 'bg-border-default',
            )} />
            <span className={cn(
              isActive ? 'text-accent-blue font-medium' : isDone ? 'text-accent-green' : 'text-text-muted',
            )}>
              {NODE_LABELS[node]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Simple code viewer
export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <pre className="text-xs font-mono text-text-primary bg-bg-primary border border-border-default rounded p-3 overflow-auto max-h-96 whitespace-pre-wrap">
      {code}
    </pre>
  )
}

// Diff viewer (simple line-based)
export function DiffViewer({ original, fixed }: { original: string; fixed: string }) {
  const origLines = original.split('\n')
  const fixedLines = fixed.split('\n')
  const maxLen = Math.max(origLines.length, fixedLines.length)

  return (
    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
      <div>
        <div className="text-text-secondary mb-1 px-2 py-1 bg-bg-tertiary rounded-t border border-border-default border-b-0">
          Original (broken)
        </div>
        <div className="border border-border-default rounded-b overflow-auto max-h-64 bg-bg-primary">
          {origLines.map((line, i) => (
            <div key={i} className={cn(
              'px-2 py-px',
              !fixedLines[i] && 'bg-red-900/20 text-accent-red',
              fixedLines[i] !== line && fixedLines[i] !== undefined && 'bg-red-900/10',
            )}>
              <span className="text-text-muted select-none mr-3">{i + 1}</span>
              {line}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-text-secondary mb-1 px-2 py-1 bg-bg-tertiary rounded-t border border-border-default border-b-0">
          Fixed
        </div>
        <div className="border border-border-default rounded-b overflow-auto max-h-64 bg-bg-primary">
          {fixedLines.map((line, i) => (
            <div key={i} className={cn(
              'px-2 py-px',
              origLines[i] !== line && 'bg-green-900/15 text-accent-green',
            )}>
              <span className="text-text-muted select-none mr-3">{i + 1}</span>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Toggle switch
export function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'w-9 h-5 rounded-full transition-colors relative',
          checked ? 'bg-accent-blue' : 'bg-bg-tertiary border border-border-default',
        )}
      >
        <div className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )} />
      </div>
      {label && <span className="text-xs text-text-secondary">{label}</span>}
    </label>
  )
}

// Stat card
export function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className={cn('text-2xl font-bold font-mono', color || 'text-text-primary')}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </Card>
  )
}
