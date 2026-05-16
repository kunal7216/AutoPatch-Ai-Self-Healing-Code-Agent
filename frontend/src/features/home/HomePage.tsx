import React from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Shield, Brain, GitBranch, BarChart3, Code2,
  ArrowRight, CheckCircle2, Activity,
} from 'lucide-react'

const FEATURES = [
  { icon: Code2, title: 'Multi-Language', desc: 'Python (pytest) and Java (JUnit 5/Maven) supported out of the box.' },
  { icon: Shield, title: 'Secure Sandbox', desc: 'Every test runs in an isolated Docker container with no network access.' },
  { icon: Brain, title: 'Vector Memory', desc: 'ChromaDB stores successful fixes and retrieves them for future repairs.' },
  { icon: Zap, title: 'Local LLM', desc: 'Powered by Ollama — 100% free, no API keys, runs on your machine.' },
  { icon: GitBranch, title: 'LangGraph Loop', desc: 'Six-node agentic loop: Test → Analyze → Retrieve → Fix → Judge → Store.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track repair history, confidence trends, error distributions, and more.' },
]

const NODES = [
  { name: 'Test Runner', color: 'bg-accent-blue', desc: 'Runs tests in Docker' },
  { name: 'Error Analyzer', color: 'bg-accent-purple', desc: 'Classifies failure type' },
  { name: 'Knowledge Retriever', color: 'bg-accent-yellow', desc: 'Searches memory + web' },
  { name: 'Code Fixer', color: 'bg-accent-orange', desc: 'LLM generates fix' },
  { name: 'Judge', color: 'bg-accent-green', desc: 'PASS / RETRY / FAIL' },
  { name: 'Memory Writer', color: 'bg-accent-red', desc: 'Stores successful fix' },
]

export function HomePage() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="border-b border-border-default bg-bg-secondary">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 rounded-full border border-border-default text-text-secondary font-mono">
              v1.0.0 · Free & Open Source
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-green-800/40 bg-green-900/20 text-accent-green font-mono">
              Local-First
            </span>
          </div>

          <h1 className="text-4xl font-bold text-text-primary mb-4 leading-tight">
            <span className="text-accent-blue">AutoPatch AI</span>
            <br />
            Self-Healing Code Agent
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mb-8">
            A free, locally runnable multi-language code repair agent. Submit broken Python or Java code
            with tests — the agent analyzes failures, retrieves knowledge, generates fixes, and reruns tests
            until they pass.
          </p>

          <div className="flex gap-3">
            <Link
              to="/repair"
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Start Repair <ArrowRight size={16} />
            </Link>
            <Link
              to="/demo-cases"
              className="flex items-center gap-2 px-5 py-2.5 bg-bg-tertiary text-text-primary rounded-lg text-sm font-medium border border-border-default hover:border-border-accent transition-colors"
            >
              View Demo Cases
            </Link>
          </div>

          {/* Stack pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Ollama', 'LangGraph', 'FastAPI', 'React', 'ChromaDB', 'Docker', 'PostgreSQL', 'SearXNG'].map(t => (
              <span key={t} className="text-xs px-2.5 py-1 bg-bg-primary border border-border-default rounded text-text-secondary font-mono">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">
        {/* Agent Loop */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-6">Agent Loop</h2>
          <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
            <div className="flex flex-wrap items-center gap-2">
              {NODES.map((node, i) => (
                <React.Fragment key={node.name}>
                  <div className="flex items-center gap-2 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2">
                    <div className={`w-2 h-2 rounded-full ${node.color}`} />
                    <div>
                      <div className="text-xs font-medium text-text-primary">{node.name}</div>
                      <div className="text-[10px] text-text-muted">{node.desc}</div>
                    </div>
                  </div>
                  {i < NODES.length - 1 && (
                    <ArrowRight size={14} className="text-text-muted" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4">
              Loops back to Test Runner on RETRY · Terminates on PASS or after max iterations
            </p>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-border-accent transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-accent-blue" />
                  <span className="text-sm font-medium text-text-primary">{title}</span>
                </div>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick start */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Start</h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-5 font-mono text-xs space-y-2">
            {[
              '# 1. Clone and start all services',
              'git clone https://github.com/yourname/autopatch-ai',
              'cd autopatch-ai && cp .env.example .env',
              'docker compose up --build',
              '',
              '# 2. Pull the LLM model (one-time)',
              'docker exec -it autopatch-ollama ollama pull qwen2.5-coder:7b',
              '',
              '# 3. Open the dashboard',
              'open http://localhost:3000',
            ].map((line, i) => (
              <div key={i} className={line.startsWith('#') ? 'text-text-muted' : line === '' ? 'h-1' : 'text-accent-green'}>
                {line}
              </div>
            ))}
          </div>
        </section>

        {/* Supported languages */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Supported Languages</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { lang: 'Python', emoji: '🐍', color: 'text-accent-blue', framework: 'pytest', build: 'python -m pytest', ext: '.py' },
              { lang: 'Java', emoji: '☕', color: 'text-accent-orange', framework: 'JUnit 5', build: 'mvn test', ext: '.java' },
            ].map(({ lang, emoji, color, framework, build, ext }) => (
              <div key={lang} className="bg-bg-secondary border border-border-default rounded-lg p-4">
                <div className={`text-2xl mb-2`}>{emoji}</div>
                <div className={`text-sm font-medium mb-1 ${color}`}>{lang}</div>
                <div className="text-xs text-text-muted space-y-0.5">
                  <div>Framework: <span className="text-text-secondary">{framework}</span></div>
                  <div>Command: <span className="font-mono text-text-secondary">{build}</span></div>
                  <div>Extension: <span className="font-mono text-text-secondary">{ext}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
