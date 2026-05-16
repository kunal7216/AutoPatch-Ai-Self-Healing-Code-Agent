// repair.ts
export type Language = 'PYTHON' | 'JAVA'
export type RunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT'
export type JudgeDecision = 'PASS' | 'RETRY' | 'FAIL'
export type AgentNode = 'TestRunner' | 'ErrorAnalyzer' | 'KnowledgeRetriever' | 'CodeFixer' | 'Judge' | 'MemoryWriter'

export interface RepairRequest {
  language: Language
  source_code: string
  test_code: string
  dependency_file?: string
  max_iterations: number
  use_memory: boolean
  use_web_search: boolean
}

export interface RepairResponse {
  run_id: string
  status: RunStatus
}

export interface IterationDetail {
  iteration_number: number
  agent_node?: string
  error_type?: string
  traceback?: string
  analysis?: string
  retrieved_context?: string
  proposed_fix_summary?: string
  test_output?: string
  passed: boolean
  confidence_score: number
  judge_decision?: string
  created_at?: string
}

export interface RunDetail {
  run_id: string
  language: string
  status: string
  original_code: string
  test_code: string
  fixed_code?: string
  passed: boolean
  iterations: number
  confidence_score: number
  explanation?: string
  created_at?: string
  completed_at?: string
  iteration_details: IterationDetail[]
}

export interface RunSummary {
  run_id: string
  language: string
  status: string
  passed: boolean
  iterations: number
  confidence_score: number
  created_at?: string
}

export interface MemoryRecord {
  id: string
  language: string
  error_type: string
  traceback_summary: string
  broken_code_summary: string
  fix_summary: string
  fixed_code_summary: string
  tags: string[]
  similarity_score?: number
  created_at?: string
}

export interface AnalyticsSummary {
  total_repairs: number
  successful_repairs: number
  failed_repairs: number
  success_rate: number
  average_confidence: number
  average_iterations: number
  memory_hits: number
  python_repairs: number
  java_repairs: number
}

export interface DemoCase {
  id: string
  title: string
  language: Language
  error_type: string
  difficulty: string
  description: string
  source_code: string
  test_code: string
}

export interface SettingsData {
  llm_provider: string
  ollama_model: string
  ollama_base_url: string
  search_provider: string
  searxng_base_url: string
  enable_web_search: boolean
  vector_db: string
  enable_memory: boolean
  sandbox_provider: string
  sandbox_timeout_seconds: number
  max_iterations: number
  backend_healthy: boolean
  ollama_healthy: boolean
  chromadb_healthy: boolean
  postgres_healthy: boolean
}

export interface SSENodeEvent {
  node: AgentNode
  iteration: number
  passed?: boolean
  error_type?: string
  confidence?: number
  decision?: string
  memory_hit?: boolean
}
