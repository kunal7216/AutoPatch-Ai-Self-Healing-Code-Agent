import React, { useState } from 'react'
import { Brain, Search } from 'lucide-react'
import { memoryService } from '../../services/api'
import {
  Card, EmptyState, LanguageBadge, Skeleton,
} from '../../components/ui'
import { formatRelativeTime, cn } from '../../lib/utils'
import type { Language } from '../../types'

export function MemoryPage() {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<string>('')
  const [errorType, setErrorType] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await memoryService.search(
        query,
        language || undefined,
        errorType || undefined,
        20,
      )
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Memory Browser</h1>
        <p className="text-sm text-text-secondary mt-0.5">Search ChromaDB for stored repair knowledge</p>
      </div>

      {/* Search bar */}
      <Card className="p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search error types, fix descriptions..."
              className="w-full pl-8 pr-3 py-2 bg-bg-primary border border-border-default rounded text-xs text-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>
          <select
            value={language} onChange={e => setLanguage(e.target.value)}
            className="bg-bg-primary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
          >
            <option value="">All Languages</option>
            <option value="PYTHON">Python</option>
            <option value="JAVA">Java</option>
          </select>
          <input
            value={errorType}
            onChange={e => setErrorType(e.target.value)}
            placeholder="Error type..."
            className="bg-bg-primary border border-border-default rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue w-36"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-blue text-white text-xs rounded font-medium hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Search size={13} /> Search
          </button>
        </div>
      </Card>

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          icon={<Brain size={32} />}
          title="No memory records found"
          description="Run some successful repairs first to populate the memory store."
        />
      )}

      {!loading && !searched && (
        <EmptyState
          icon={<Brain size={32} />}
          title="Search your repair memory"
          description="Enter a search query to find similar past fixes stored in ChromaDB."
        />
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-text-secondary mb-2">{results.length} result(s) found</div>
          {results.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <LanguageBadge language={r.language} />
                  <span className="text-xs px-2 py-0.5 bg-bg-tertiary border border-border-default rounded text-text-secondary">
                    {r.error_type}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  {r.similarity_score !== undefined && (
                    <div className={cn(
                      'text-xs font-mono font-medium',
                      r.similarity_score > 0.8 ? 'text-accent-green' :
                      r.similarity_score > 0.6 ? 'text-accent-yellow' : 'text-text-secondary',
                    )}>
                      {(r.similarity_score * 100).toFixed(1)}% match
                    </div>
                  )}
                  <div className="text-[10px] text-text-muted">{formatRelativeTime(r.created_at)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-text-muted mb-1">Broken Code</div>
                  <pre className="bg-bg-primary border border-border-default rounded p-2 text-[10px] font-mono text-text-secondary overflow-hidden max-h-20 whitespace-pre-wrap">
                    {r.broken_code_summary}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted mb-1">Fix Applied</div>
                  <pre className="bg-bg-primary border border-border-default rounded p-2 text-[10px] font-mono text-accent-green overflow-hidden max-h-20 whitespace-pre-wrap">
                    {r.fixed_code_summary}
                  </pre>
                </div>
              </div>

              {r.fix_summary && (
                <div className="mt-2 text-[10px] text-text-secondary">{r.fix_summary}</div>
              )}

              {r.tags?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {r.tags.filter(Boolean).map((tag: string) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary border border-border-muted rounded text-text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
