import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { runService } from '../../services/api'
import {
  StatusBadge, LanguageBadge, ConfidenceMeter, DiffViewer, CodeBlock, Card, Skeleton,
} from '../../components/ui'
import { formatDate, formatRelativeTime, cn } from '../../lib/utils'

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>()
  const [expandedIter, setExpandedIter] = useState<number | null>(null)

  const { data: run, isLoading } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => runService.get(runId!),
    refetchInterval: (data) => (data?.status === 'RUNNING' || data?.status === 'QUEUED') ? 2000 : false,
    enabled: !!runId,
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!run) {
    return (
      <div className="p-6 text-text-secondary text-sm">Run not found.</div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/runs" className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary mb-3">
          <ArrowLeft size={12} /> Back to History
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-text-primary font-mono">{run.run_id}</h1>
          <StatusBadge status={run.status} />
          <LanguageBadge language={run.language} />
          {run.passed
            ? <span className="text-xs text-accent-green">✅ Tests Passed</span>
            : <span className="text-xs text-accent-red">❌ Not Fixed</span>}
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Iterations', value: run.iterations },
          { label: 'Created', value: formatRelativeTime(run.created_at) },
          { label: 'Completed', value: run.completed_at ? formatRelativeTime(run.completed_at) : '—' },
          { label: 'Language', value: run.language },
        ].map(({ label, value }) => (
          <Card key={label} className="p-3">
            <div className="text-[10px] text-text-muted mb-0.5">{label}</div>
            <div className="text-sm text-text-primary font-medium">{value}</div>
          </Card>
        ))}
      </div>

      {/* Confidence */}
      <Card className="p-4">
        <div className="text-xs text-text-secondary mb-2">Confidence Score</div>
        <ConfidenceMeter score={run.confidence_score} />
      </Card>

      {/* Explanation */}
      {run.explanation && (
        <Card className="p-4">
          <div className="text-xs text-text-secondary mb-2">Explanation</div>
          <p className="text-sm text-text-primary">{run.explanation}</p>
        </Card>
      )}

      {/* Diff viewer */}
      {run.fixed_code && (
        <Card className="p-4">
          <div className="text-xs text-text-secondary mb-3">Code Diff</div>
          <DiffViewer original={run.original_code} fixed={run.fixed_code} />
        </Card>
      )}

      {/* Original code */}
      <Card className="p-4">
        <div className="text-xs text-text-secondary mb-2">Original Broken Code</div>
        <CodeBlock code={run.original_code} />
      </Card>

      {/* Test code */}
      <Card className="p-4">
        <div className="text-xs text-text-secondary mb-2">Test Code</div>
        <CodeBlock code={run.test_code} />
      </Card>

      {/* Fixed code */}
      {run.fixed_code && (
        <Card className="p-4">
          <div className="text-xs text-text-secondary mb-2">Fixed Code</div>
          <CodeBlock code={run.fixed_code} />
        </Card>
      )}

      {/* Iterations */}
      {run.iteration_details?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Iteration Timeline</h2>
          <div className="space-y-2">
            {run.iteration_details.map((iter) => (
              <Card key={iter.iteration_number}>
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setExpandedIter(expandedIter === iter.iteration_number ? null : iter.iteration_number)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      iter.passed ? 'bg-green-900/40 text-accent-green' : 'bg-red-900/30 text-accent-red',
                    )}>
                      {iter.iteration_number}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium text-text-primary">
                        Iteration {iter.iteration_number}
                        {iter.error_type && <span className="ml-2 text-text-muted">· {iter.error_type}</span>}
                      </div>
                      {iter.judge_decision && (
                        <div className={cn(
                          'text-[10px]',
                          iter.judge_decision === 'PASS' ? 'text-accent-green' :
                          iter.judge_decision === 'RETRY' ? 'text-accent-yellow' : 'text-accent-red',
                        )}>
                          Judge: {iter.judge_decision}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ConfidenceMeter score={iter.confidence_score} />
                    {expandedIter === iter.iteration_number ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {expandedIter === iter.iteration_number && (
                  <div className="border-t border-border-muted p-4 space-y-3">
                    {iter.analysis && (
                      <div>
                        <div className="text-[10px] text-text-muted mb-1">Analysis</div>
                        <p className="text-xs text-text-secondary">{iter.analysis}</p>
                      </div>
                    )}
                    {iter.traceback && (
                      <div>
                        <div className="text-[10px] text-text-muted mb-1">Traceback</div>
                        <pre className="text-[10px] font-mono text-accent-red bg-bg-primary border border-border-default rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">
                          {iter.traceback}
                        </pre>
                      </div>
                    )}
                    {iter.test_output && (
                      <div>
                        <div className="text-[10px] text-text-muted mb-1">Test Output</div>
                        <pre className="text-[10px] font-mono text-text-secondary bg-bg-primary border border-border-default rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap">
                          {iter.test_output}
                        </pre>
                      </div>
                    )}
                    {iter.proposed_fix_summary && (
                      <div>
                        <div className="text-[10px] text-text-muted mb-1">Fix Summary</div>
                        <p className="text-xs text-text-secondary">{iter.proposed_fix_summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
