import React from 'react'
import { Card } from '../../components/ui'

const ARCH_DIAGRAM = `
User Uploads Code + Tests
         │
         ▼
React Developer Dashboard
         │
         ▼
FastAPI Backend (Port 8000)
         │
         ▼
LangGraph Agent
         │
         ├──▶ Test Runner Node
         │         ├──▶ Docker Python Sandbox (pytest)
         │         └──▶ Docker Java Sandbox (mvn test)
         │
         ├──▶ Error Analyzer Node
         │         └──▶ Classifies: TypeError, NPE, LogicError...
         │
         ├──▶ Knowledge Retriever Node
         │         ├──▶ ChromaDB Vector Memory
         │         └──▶ SearXNG / DuckDuckGo Search
         │
         ├──▶ Code Fixer Node
         │         └──▶ Ollama LLM (qwen2.5-coder:7b)
         │
         ├──▶ Judge Node
         │         └──▶ PASS / RETRY / FAIL + Confidence Score
         │
         └──▶ Memory Writer Node
                   └──▶ Stores fix in ChromaDB + PostgreSQL
         │
         ▼
Fixed Code + Explanation + Confidence Score
`

const NODES = [
  {
    name: 'Test Runner',
    color: 'border-blue-600 bg-blue-900/20',
    badge: 'text-accent-blue',
    desc: 'Runs tests inside ephemeral Docker containers. Python uses pytest, Java uses Maven/JUnit 5. Network is disabled, CPU/memory is capped, and all files are deleted after execution.',
    details: ['Docker SDK for Python', 'Network disabled by default', 'Timeout: 20s', 'Memory: 512MB cap'],
  },
  {
    name: 'Error Analyzer',
    color: 'border-purple-600 bg-purple-900/20',
    badge: 'text-accent-purple',
    desc: 'Classifies the failure type using regex pattern matching and LLM analysis. Extracts the traceback, failing function, and root cause.',
    details: ['Python: 8 error types', 'Java: 9 error types', 'Traceback extraction', 'LLM deep analysis'],
  },
  {
    name: 'Knowledge Retriever',
    color: 'border-yellow-600 bg-yellow-900/20',
    badge: 'text-accent-yellow',
    desc: 'Searches ChromaDB vector store for similar past fixes. Falls back to SearXNG web search, then DuckDuckGo. Gracefully skips if unavailable.',
    details: ['ChromaDB cosine similarity', 'SearXNG primary search', 'DuckDuckGo fallback', 'Top-3 results'],
  },
  {
    name: 'Code Fixer',
    color: 'border-orange-600 bg-orange-900/20',
    badge: 'text-accent-orange',
    desc: 'Sends a structured prompt to Ollama with the broken code, traceback, and retrieved context. Validates and cleans the response before updating state.',
    details: ['Ollama local LLM', 'qwen2.5-coder:7b default', 'Minimal diff approach', 'No test modification'],
  },
  {
    name: 'Judge',
    color: 'border-green-600 bg-green-900/20',
    badge: 'text-accent-green',
    desc: 'Evaluates test results and decides PASS, RETRY, or FAIL. Calculates a confidence score based on iterations, memory hits, and new errors introduced.',
    details: ['PASS / RETRY / FAIL', 'Confidence scoring', 'New error detection', 'Loop termination guard'],
  },
  {
    name: 'Memory Writer',
    color: 'border-red-600 bg-red-900/20',
    badge: 'text-accent-red',
    desc: 'On a successful repair, embeds and stores the fix in ChromaDB with metadata. Also records the run in PostgreSQL for history and analytics.',
    details: ['ChromaDB embeddings', 'PostgreSQL persistence', 'Tag extraction', 'Non-blocking write'],
  },
]

const SAFETY_POINTS = [
  'Docker sandbox only — no direct code execution on host',
  'No arbitrary shell commands from LLM — only allowlisted commands',
  'Network disabled inside containers by default',
  'Temporary workspace mounted at /tmp/autopatch — deleted after run',
  'CPU and memory limits enforced via Docker resource constraints',
  'File size and extension validation before execution',
  'Timeout on every test run (default: 20 seconds)',
  'Container forcefully removed even on timeout or crash',
]

export function ArchitecturePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Architecture</h1>
        <p className="text-sm text-text-secondary mt-0.5">System design and agent flow</p>
      </div>

      {/* ASCII diagram */}
      <Card className="p-6">
        <div className="text-xs font-medium text-text-secondary mb-4">System Architecture Diagram</div>
        <pre className="text-xs font-mono text-text-secondary whitespace-pre leading-relaxed">
          {ARCH_DIAGRAM}
        </pre>
      </Card>

      {/* Node explanations */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-4">Agent Nodes</h2>
        <div className="space-y-3">
          {NODES.map(node => (
            <Card key={node.name} className={`p-4 border ${node.color}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className={`text-sm font-semibold ${node.badge}`}>{node.name}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-secondary mb-2">{node.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {node.details.map(d => (
                      <span key={d} className="text-[10px] px-2 py-0.5 bg-bg-primary border border-border-default rounded text-text-muted">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Safety controls */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">🔒 Sandbox Security Controls</h2>
        <div className="space-y-2">
          {SAFETY_POINTS.map(p => (
            <div key={p} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="text-accent-green mt-0.5 flex-shrink-0">✓</span>
              {p}
            </div>
          ))}
        </div>
      </Card>

      {/* Docker services */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Docker Compose Services</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'backend', port: '8000', desc: 'FastAPI + LangGraph' },
            { name: 'frontend', port: '3000', desc: 'React + Vite' },
            { name: 'postgres', port: '5432', desc: 'Run history & metadata' },
            { name: 'chromadb', port: '8001', desc: 'Vector memory store' },
            { name: 'searxng', port: '8080', desc: 'Free web search' },
            { name: 'ollama', port: '11434', desc: 'Local LLM runtime' },
            { name: 'python-sandbox', port: '—', desc: 'Isolated pytest runner' },
            { name: 'java-sandbox', port: '—', desc: 'Isolated mvn runner' },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-2 bg-bg-primary border border-border-default rounded p-2">
              <div className="font-mono text-xs text-accent-blue">{s.name}</div>
              <div className="text-[10px] text-text-muted">:{s.port}</div>
              <div className="text-[10px] text-text-secondary ml-auto">{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
