from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models.enums import Language, RunStatus, JudgeDecision, AgentNode


class RepairRequest(BaseModel):
    language: Language
    source_code: str
    test_code: str
    dependency_file: Optional[str] = None
    max_iterations: int = Field(default=5, ge=1, le=10)
    use_memory: bool = True
    use_web_search: bool = True


class RepairResponse(BaseModel):
    run_id: str
    status: RunStatus


class IterationDetail(BaseModel):
    iteration_number: int
    agent_node: Optional[str] = None
    error_type: Optional[str] = None
    traceback: Optional[str] = None
    analysis: Optional[str] = None
    retrieved_context: Optional[str] = None
    proposed_fix_summary: Optional[str] = None
    test_output: Optional[str] = None
    passed: bool = False
    confidence_score: float = 0.0
    judge_decision: Optional[str] = None
    created_at: Optional[datetime] = None


class RunDetailResponse(BaseModel):
    run_id: str
    language: str
    status: str
    original_code: str
    test_code: str
    fixed_code: Optional[str] = None
    passed: bool = False
    iterations: int = 0
    confidence_score: float = 0.0
    explanation: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    iteration_details: List[IterationDetail] = []


class RunSummary(BaseModel):
    run_id: str
    language: str
    status: str
    passed: bool
    iterations: int
    confidence_score: float
    created_at: Optional[datetime] = None


class MemorySearchRequest(BaseModel):
    query: str
    language: Optional[Language] = None
    error_type: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=50)


class MemoryRecord(BaseModel):
    id: str
    language: str
    error_type: str
    traceback_summary: str
    broken_code_summary: str
    fix_summary: str
    fixed_code_summary: str
    tags: List[str] = []
    similarity_score: Optional[float] = None
    created_at: Optional[datetime] = None


class AnalyticsSummary(BaseModel):
    total_repairs: int
    successful_repairs: int
    failed_repairs: int
    success_rate: float
    average_confidence: float
    average_iterations: float
    memory_hits: int
    python_repairs: int
    java_repairs: int


class RepairTrendPoint(BaseModel):
    date: str
    total: int
    successful: int
    failed: int


class ErrorDistributionItem(BaseModel):
    error_type: str
    count: int
    percentage: float


class LanguageUsageItem(BaseModel):
    language: str
    count: int
    success_rate: float


class ConfidenceTrendPoint(BaseModel):
    date: str
    average_confidence: float


class DemoCase(BaseModel):
    id: str
    title: str
    language: Language
    error_type: str
    difficulty: str
    description: str
    source_code: str
    test_code: str


class SettingsResponse(BaseModel):
    llm_provider: str
    ollama_model: str
    ollama_base_url: str
    search_provider: str
    searxng_base_url: str
    enable_web_search: bool
    vector_db: str
    enable_memory: bool
    sandbox_provider: str
    sandbox_timeout_seconds: int
    max_iterations: int
    backend_healthy: bool
    ollama_healthy: bool
    chromadb_healthy: bool
    postgres_healthy: bool


class SSEEvent(BaseModel):
    event: str
    data: Any
    run_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
