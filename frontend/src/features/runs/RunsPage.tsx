import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { History, ExternalLink, Filter } from 'lucide-react'
import { runService } from '../../services/api'
import {
  StatusBadge, LanguageBadge, ConfidenceMeter, EmptyState, Skeleton, Card,
} from '../../components/ui'
import { formatRelativeTime, cn } from '../../lib/utils'

export function RunsPage() {
  const [language, setLanguage] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [passed, setPassed] = useState<string>('')

  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', language, status, passed],
    queryFn: () => runService.list({
      limit: 100,
      language: language || undefined,
      status: status || undefined,
      passed: passed === '' ? undefined : passed === 'true',
    }),
    refetchInterval: 5000,
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Run History</h1>
          <p className="text-sm text-text-secondary mt-0.5">All past repair runs</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 mb-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-text-muted" />
        <select
          value={language} onChange={e => setLanguage(e.target.value)}
          className="bg-bg-primary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
        >
          <option value="">All Languages</option>
          <option value="PYTHON">Python</option>
          <option value="JAVA">Java</option>
        </select>
        <select
          value={status} onChange={e => setStatus(e.target.value)}
          className="bg-bg-primary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="RUNNING">Running</option>
          <option value="QUEUED">Queued</option>
        </select>
        <select
          value={passed} onChange={e => setPassed(e.target.value)}
          className="bg-bg-primary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
        >
          <option value="">All Results</option>
          <option value="true">Passed</option>
          <option value="false">Failed</option>
        </select>
        {(language || status || passed) && (
          <button
            onClick={() => { setLanguage(''); setStatus(''); setPassed('') }}
            className="text-xs text-text-secondary hover:text-text-primary underline"
          >
            Clear
          </button>
        )}
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                {['Run ID', 'Language', 'Status', 'Passed', 'Iterations', 'Confidence', 'Created', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-muted">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-3 w-20" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && (!runs || runs.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      icon={<History size={32} />}
                      title="No runs yet"
                      description="Submit your first repair to get started"
                    />
                  </td>
                </tr>
              )}
              {runs?.map(run => (
                <tr key={run.run_id} className="border-b border-border-muted hover:bg-bg-tertiary transition-colors">
                  <td className="px-4 py-3 font-mono text-text-secondary">{run.run_id.slice(0, 16)}...</td>
                  <td className="px-4 py-3"><LanguageBadge language={run.language} /></td>
                  <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-4 py-3">
                    <span className={run.passed ? 'text-accent-green' : 'text-accent-red'}>
                      {run.passed ? '✅ Yes' : '❌ No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{run.iterations}</td>
                  <td className="px-4 py-3 w-36"><ConfidenceMeter score={run.confidence_score} /></td>
                  <td className="px-4 py-3 text-text-muted">{formatRelativeTime(run.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/runs/${run.run_id}`}
                      className="text-accent-blue hover:text-blue-400 flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
