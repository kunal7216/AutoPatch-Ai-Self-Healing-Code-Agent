import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlayCircle, ArrowRight, Zap } from 'lucide-react'
import { demoCaseService } from '../../services/api'
import { useRepairStore } from '../../store/repairStore'
import { Card, LanguageBadge, EmptyState, Skeleton } from '../../components/ui'
import { cn } from '../../lib/utils'
import type { DemoCase } from '../../types'
import toast from 'react-hot-toast'

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'text-accent-green border-green-800/30 bg-green-900/10',
  Medium: 'text-accent-yellow border-yellow-800/30 bg-yellow-900/10',
  Hard: 'text-accent-red border-red-800/30 bg-red-900/10',
}

export function DemoCasesPage() {
  const navigate = useNavigate()
  const { setForm, reset } = useRepairStore()

  const { data: cases, isLoading } = useQuery({
    queryKey: ['demo-cases'],
    queryFn: demoCaseService.list,
  })

  function loadAndNavigate(dc: DemoCase) {
    reset()
    setForm({
      language: dc.language,
      sourceCode: dc.source_code,
      testCode: dc.test_code,
    })
    toast.success(`Loaded: ${dc.title}`)
    navigate('/repair')
  }

  const pythonCases = cases?.filter(c => c.language === 'PYTHON') ?? []
  const javaCases = cases?.filter(c => c.language === 'JAVA') ?? []

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Demo Cases</h1>
        <p className="text-sm text-text-secondary mt-0.5">Pre-built broken code examples to test AutoPatch AI</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && cases && (
        <>
          {/* Python section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🐍</span>
              <h2 className="text-sm font-semibold text-text-primary">Python Cases</h2>
              <span className="text-xs text-text-muted">({pythonCases.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pythonCases.map(dc => (
                <DemoCaseCard key={dc.id} dc={dc} onLoad={loadAndNavigate} />
              ))}
            </div>
          </div>

          {/* Java section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">☕</span>
              <h2 className="text-sm font-semibold text-text-primary">Java Cases</h2>
              <span className="text-xs text-text-muted">({javaCases.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {javaCases.map(dc => (
                <DemoCaseCard key={dc.id} dc={dc} onLoad={loadAndNavigate} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DemoCaseCard({ dc, onLoad }: { dc: DemoCase; onLoad: (dc: DemoCase) => void }) {
  return (
    <Card className="p-4 hover:border-border-accent transition-colors flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <LanguageBadge language={dc.language} />
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', DIFFICULTY_COLOR[dc.difficulty])}>
          {dc.difficulty}
        </span>
      </div>

      <h3 className="text-sm font-medium text-text-primary mb-1">{dc.title}</h3>
      <p className="text-xs text-text-secondary mb-3 flex-1">{dc.description}</p>

      <div className="mb-3">
        <span className="text-[10px] px-2 py-0.5 bg-bg-tertiary border border-border-default rounded text-text-muted">
          {dc.error_type}
        </span>
      </div>

      {/* Code preview */}
      <pre className="text-[9px] font-mono text-text-muted bg-bg-primary border border-border-muted rounded p-2 overflow-hidden max-h-16 mb-3 whitespace-pre-wrap">
        {dc.source_code.slice(0, 200)}
      </pre>

      <button
        onClick={() => onLoad(dc)}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-bg-tertiary border border-border-default rounded text-xs text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
      >
        <PlayCircle size={13} /> Load into Workspace
      </button>
    </Card>
  )
}
