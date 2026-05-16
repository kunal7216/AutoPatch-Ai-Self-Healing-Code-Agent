import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { settingsService } from '../../services/api'
import { Card, Skeleton } from '../../components/ui'
import { cn } from '../../lib/utils'

function HealthDot({ ok }: { ok: boolean }) {
  return (
    <span className={cn(
      'flex items-center gap-1.5 text-xs',
      ok ? 'text-accent-green' : 'text-accent-red',
    )}>
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {ok ? 'Healthy' : 'Unavailable'}
    </span>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-muted last:border-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs text-text-primary font-mono">{value}</span>
    </div>
  )
}

export function SettingsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.get,
    refetchInterval: 30_000,
  })

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Current system configuration</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-border-default rounded hover:text-text-primary hover:border-border-accent transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)}
        </div>
      )}

      {data && (
        <>
          {/* Service health */}
          <Card className="p-4">
            <div className="text-xs font-medium text-text-secondary mb-3">Service Health</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Backend API', ok: data.backend_healthy },
                { label: 'Ollama LLM', ok: data.ollama_healthy },
                { label: 'ChromaDB', ok: data.chromadb_healthy },
                { label: 'PostgreSQL', ok: data.postgres_healthy },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between bg-bg-primary border border-border-default rounded p-2.5">
                  <span className="text-xs text-text-secondary">{label}</span>
                  <HealthDot ok={ok} />
                </div>
              ))}
            </div>
          </Card>

          {/* LLM */}
          <Card className="p-4">
            <div className="text-xs font-medium text-text-secondary mb-3">LLM Configuration</div>
            <Row label="Provider" value={data.llm_provider} />
            <Row label="Model" value={data.ollama_model} />
            <Row label="Base URL" value={data.ollama_base_url} />
          </Card>

          {/* Search */}
          <Card className="p-4">
            <div className="text-xs font-medium text-text-secondary mb-3">Search Configuration</div>
            <Row label="Provider" value={data.search_provider} />
            <Row label="SearXNG URL" value={data.searxng_base_url} />
            <Row label="Web Search" value={data.enable_web_search ? '✅ Enabled' : '❌ Disabled'} />
          </Card>

          {/* Memory */}
          <Card className="p-4">
            <div className="text-xs font-medium text-text-secondary mb-3">Memory Configuration</div>
            <Row label="Vector DB" value={data.vector_db} />
            <Row label="Memory" value={data.enable_memory ? '✅ Enabled' : '❌ Disabled'} />
          </Card>

          {/* Sandbox */}
          <Card className="p-4">
            <div className="text-xs font-medium text-text-secondary mb-3">Sandbox Configuration</div>
            <Row label="Provider" value={data.sandbox_provider} />
            <Row label="Timeout" value={`${data.sandbox_timeout_seconds}s`} />
            <Row label="Max Iterations" value={data.max_iterations} />
          </Card>

          {/* Quick commands */}
          <Card className="p-4">
            <div className="text-xs font-medium text-text-secondary mb-3">Useful Commands</div>
            <div className="space-y-2 font-mono text-xs">
              {[
                '# Start all services',
                'docker compose up --build',
                '',
                '# Pull LLM model (one-time)',
                'docker exec -it autopatch-ollama ollama pull qwen2.5-coder:7b',
                '',
                '# Check Ollama models',
                'docker exec -it autopatch-ollama ollama list',
                '',
                '# View backend logs',
                'docker compose logs -f backend',
              ].map((line, i) => (
                <div key={i} className={cn(
                  line === '' ? 'h-1' : '',
                  line.startsWith('#') ? 'text-text-muted' : 'text-accent-green',
                )}>
                  {line}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
