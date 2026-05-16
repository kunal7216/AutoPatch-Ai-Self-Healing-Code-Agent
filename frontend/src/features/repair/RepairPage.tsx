import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Play, RotateCcw, Copy, Download, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Loader2, Terminal,
} from 'lucide-react'
import { repairService, demoCaseService } from '../../services/api'
import { useRepairStore } from '../../store/repairStore'
import {
  AgentStepper, Card, ConfidenceMeter, DiffViewer,
  LanguageBadge, StatusBadge, Toggle, CodeBlock,
} from '../../components/ui'
import { cn } from '../../lib/utils'
import type { DemoCase, Language } from '../../types'

const DEMO_PLACEHOLDER = {
  PYTHON: {
    source: `def factorial(n):
    if n == 0:
        return 0  # Bug: should be 1
    return n * factorial(n - 1)
`,
    test: `from source import factorial

def test_factorial_zero():
    assert factorial(0) == 1

def test_factorial_five():
    assert factorial(5) == 120
`,
  },
  JAVA: {
    source: `package com.autopatch;

public class Solution {
    public String process(String input) {
        return input.trim().toLowerCase(); // Bug: no null check
    }
}
`,
    test: `package com.autopatch;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SolutionTest {
    @Test
    public void testNull() {
        Solution s = new Solution();
        assertEquals("", s.process(null));
    }

    @Test
    public void testNormal() {
        Solution s = new Solution();
        assertEquals("hello", s.process("  Hello  "));
    }
}
`,
  },
}

const AGENT_NODES = ['TestRunner', 'ErrorAnalyzer', 'KnowledgeRetriever', 'CodeFixer', 'Judge', 'MemoryWriter']

export function RepairPage() {
  const navigate = useNavigate()
  const {
    form, setForm, runId, setRunId, isRunning, setRunning,
    currentNode, setCurrentNode, currentIteration, setCurrentIteration,
    logs, addLog, result, setResult, pushEvent, reset,
  } = useRepairStore()

  const [completedNodes, setCompletedNodes] = useState<string[]>([])
  const [showFixed, setShowFixed] = useState(false)
  const [activeTab, setActiveTab] = useState<'source' | 'test' | 'deps'>('source')
  const [demoCases, setDemoCases] = useState<DemoCase[]>([])
  const logsRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    demoCaseService.list().then(setDemoCases).catch(() => {})
    return () => { esRef.current?.close() }
  }, [])

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight
  }, [logs])

  // Set placeholder on language change
  useEffect(() => {
    const ph = DEMO_PLACEHOLDER[form.language]
    if (!form.sourceCode) setForm({ sourceCode: ph.source, testCode: ph.test })
  }, [form.language])

  function loadDemoCase(dc: DemoCase) {
    setForm({
      language: dc.language,
      sourceCode: dc.source_code,
      testCode: dc.test_code,
    })
    toast.success(`Loaded: ${dc.title}`)
  }

  async function handleRun() {
    if (!form.sourceCode.trim() || !form.testCode.trim()) {
      toast.error('Source code and test code are required')
      return
    }

    reset()
    setCompletedNodes([])
    setShowFixed(false)

    try {
      const res = await repairService.submit({
        language: form.language,
        source_code: form.sourceCode,
        test_code: form.testCode,
        dependency_file: form.dependencyFile || undefined,
        max_iterations: form.maxIterations,
        use_memory: form.useMemory,
        use_web_search: form.useWebSearch,
      })

      setRunId(res.run_id)
      setRunning(true)
      addLog(`[→] Run started: ${res.run_id}`)

      const es = repairService.streamEvents(res.run_id)
      esRef.current = es

      es.addEventListener('started', (e) => {
        addLog('[→] Agent loop started')
        pushEvent('started', JSON.parse(e.data))
      })

      es.addEventListener('iteration_start', (e) => {
        const d = JSON.parse(e.data)
        setCurrentIteration(d.iteration)
        addLog(`\n[⟳] Iteration ${d.iteration}/${d.max}`)
      })

      es.addEventListener('node_start', (e) => {
        const d = JSON.parse(e.data)
        setCurrentNode(d.node)
        addLog(`  [▶] ${d.node}...`)
      })

      es.addEventListener('node_complete', (e) => {
        const d = JSON.parse(e.data)
        setCompletedNodes(prev => [...prev, d.node])
        const info = d.passed !== undefined ? ` (passed: ${d.passed})` :
          d.error_type ? ` (${d.error_type})` :
          d.decision ? ` → ${d.decision}` :
          d.confidence ? ` conf: ${(d.confidence * 100).toFixed(0)}%` : ''
        addLog(`  [✓] ${d.node}${info}`)
        pushEvent('node_complete', d)
      })

      es.addEventListener('tests_passed', (e) => {
        addLog('\n[✅] Tests passed!')
      })

      es.addEventListener('completed', (e) => {
        const d = JSON.parse(e.data)
        addLog(`\n[■] Completed — ${d.passed ? '✅ PASS' : '❌ FAIL'} in ${d.iterations} iteration(s)`)
        es.close()
        setCurrentNode(null)
        setRunning(false)
        // Fetch full result
        repairService.getResult(res.run_id).then(r => {
          setResult(r)
          if (r.passed) setShowFixed(true)
        })
      })

      es.addEventListener('error', (e) => {
        const d = JSON.parse((e as MessageEvent).data || '{}')
        addLog(`\n[✗] Error: ${d.message || 'Unknown error'}`)
        es.close()
        setRunning(false)
      })

      es.addEventListener('done', () => {
        es.close()
        setRunning(false)
      })

      es.onerror = () => {
        addLog('\n[!] Connection lost — checking result...')
        es.close()
        setRunning(false)
        repairService.getResult(res.run_id).then(r => {
          setResult(r)
          if (r.passed) setShowFixed(true)
        }).catch(() => {})
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start repair')
      setRunning(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.success('Copied!'))
  }

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-72 flex-shrink-0 border-r border-border-default bg-bg-secondary flex flex-col">
        <div className="p-4 border-b border-border-default">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Configuration</h2>

          {/* Language */}
          <div className="mb-4">
            <label className="text-xs text-text-secondary mb-1.5 block">Language</label>
            <div className="flex gap-2">
              {(['PYTHON', 'JAVA'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => setForm({ language: l, sourceCode: '', testCode: '' })}
                  className={cn(
                    'flex-1 py-1.5 text-xs rounded border transition-colors',
                    form.language === l
                      ? 'border-accent-blue bg-blue-900/20 text-accent-blue'
                      : 'border-border-default text-text-secondary hover:border-border-accent',
                  )}
                >
                  {l === 'PYTHON' ? '🐍 Python' : '☕ Java'}
                </button>
              ))}
            </div>
          </div>

          {/* Demo cases */}
          {demoCases.length > 0 && (
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-1.5 block">Load Demo Case</label>
              <select
                className="w-full bg-bg-primary border border-border-default rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
                onChange={e => {
                  const dc = demoCases.find(d => d.id === e.target.value)
                  if (dc) loadDemoCase(dc)
                }}
                defaultValue=""
              >
                <option value="" disabled>Select demo case...</option>
                {demoCases
                  .filter(dc => dc.language === form.language)
                  .map(dc => (
                    <option key={dc.id} value={dc.id}>{dc.title}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Max iterations */}
          <div className="mb-4">
            <label className="text-xs text-text-secondary mb-1.5 block">
              Max Iterations: <span className="text-text-primary font-mono">{form.maxIterations}</span>
            </label>
            <input
              type="range" min={1} max={10} value={form.maxIterations}
              onChange={e => setForm({ maxIterations: +e.target.value })}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle checked={form.useMemory} onChange={v => setForm({ useMemory: v })} label="Use Memory (ChromaDB)" />
            <Toggle checked={form.useWebSearch} onChange={v => setForm({ useWebSearch: v })} label="Use Web Search" />
          </div>
        </div>

        {/* Run button */}
        <div className="p-4">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <><Loader2 size={16} className="animate-spin" /> Running...</>
            ) : (
              <><Play size={16} /> Run Repair</>
            )}
          </button>

          {runId && (
            <button
              onClick={() => navigate(`/runs/${runId}`)}
              className="w-full mt-2 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border-default rounded hover:border-border-accent transition-colors"
            >
              View Full Report →
            </button>
          )}
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex border-b border-border-default">
          {[
            { id: 'source', label: 'Source Code' },
            { id: 'test', label: 'Test Code' },
            { id: 'deps', label: 'Dependencies' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-accent-blue text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
          {/* Code editor */}
          <div className="flex-1">
            {activeTab === 'source' && (
              <textarea
                value={form.sourceCode}
                onChange={e => setForm({ sourceCode: e.target.value })}
                className="w-full h-full bg-bg-primary border border-border-default rounded p-3 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-blue resize-none"
                placeholder="Paste your broken source code here..."
                spellCheck={false}
              />
            )}
            {activeTab === 'test' && (
              <textarea
                value={form.testCode}
                onChange={e => setForm({ testCode: e.target.value })}
                className="w-full h-full bg-bg-primary border border-border-default rounded p-3 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-blue resize-none"
                placeholder="Paste your test code here..."
                spellCheck={false}
              />
            )}
            {activeTab === 'deps' && (
              <textarea
                value={form.dependencyFile}
                onChange={e => setForm({ dependencyFile: e.target.value })}
                className="w-full h-full bg-bg-primary border border-border-default rounded p-3 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-blue resize-none"
                placeholder="Optional: requirements.txt (Python) or additional Maven deps (Java)"
                spellCheck={false}
              />
            )}
          </div>

          {/* Fixed code / diff viewer */}
          {result && result.fixed_code && showFixed && (
            <div className="border-t border-border-default pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">Fixed Code — Diff</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyCode(result.fixed_code!)}
                    className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded border border-border-default hover:border-border-accent"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>
              <DiffViewer original={form.sourceCode} fixed={result.fixed_code} />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-72 flex-shrink-0 border-l border-border-default bg-bg-secondary flex flex-col">
        {/* Status header */}
        <div className="p-4 border-b border-border-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">Agent Status</span>
            {result && <StatusBadge status={result.passed ? 'COMPLETED' : 'FAILED'} />}
          </div>

          {currentIteration > 0 && (
            <div className="text-xs text-text-secondary mb-2">
              Iteration <span className="text-text-primary font-mono">{currentIteration}</span>
              /{form.maxIterations}
            </div>
          )}

          {result && (
            <div className="space-y-1.5">
              <ConfidenceMeter score={result.confidence_score} />
              <div className="flex gap-3 text-xs text-text-secondary">
                <span>Iterations: <span className="text-text-primary">{result.iterations}</span></span>
                <LanguageBadge language={result.language} />
              </div>
            </div>
          )}
        </div>

        {/* Agent stepper */}
        <div className="p-4 border-b border-border-default">
          <div className="text-xs text-text-secondary mb-2">Nodes</div>
          <AgentStepper currentNode={currentNode} completedNodes={completedNodes} />
        </div>

        {/* Result indicator */}
        {result && (
          <div className={cn(
            'mx-4 mt-4 p-3 rounded-lg border flex items-center gap-2',
            result.passed
              ? 'bg-green-900/20 border-green-800/40'
              : 'bg-red-900/20 border-red-800/40',
          )}>
            {result.passed
              ? <CheckCircle2 size={16} className="text-accent-green" />
              : <XCircle size={16} className="text-accent-red" />}
            <div>
              <div className={cn('text-xs font-medium', result.passed ? 'text-accent-green' : 'text-accent-red')}>
                {result.passed ? 'Tests Passed!' : 'Could Not Fix'}
              </div>
              {result.explanation && (
                <div className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{result.explanation}</div>
              )}
            </div>
          </div>
        )}

        {/* Live logs */}
        <div className="flex-1 flex flex-col p-4 min-h-0">
          <div className="flex items-center gap-1 mb-2">
            <Terminal size={12} className="text-text-muted" />
            <span className="text-xs text-text-secondary">Live Logs</span>
          </div>
          <div
            ref={logsRef}
            className="flex-1 bg-bg-primary border border-border-default rounded p-2 overflow-y-auto font-mono text-[10px] text-text-secondary whitespace-pre-wrap"
          >
            {logs.length === 0
              ? <span className="text-text-muted">Logs will appear here...</span>
              : logs.join('\n')}
          </div>
        </div>
      </div>
    </div>
  )
}
