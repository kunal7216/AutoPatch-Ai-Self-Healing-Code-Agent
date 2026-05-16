from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.models.schemas import (
    RunSummary, RunDetailResponse, IterationDetail,
    MemorySearchRequest, MemoryRecord,
    AnalyticsSummary, RepairTrendPoint, ErrorDistributionItem, LanguageUsageItem,
    DemoCase, SettingsResponse,
)
from app.services.storage.repositories import RepairRunRepository, IterationRepository
from app.services.memory.chroma_service import ChromaMemoryService
from app.services.llm.ollama_provider import OllamaProvider
from app.config import settings
from app.demo_cases import DEMO_CASES, get_demo_case

memory_service = ChromaMemoryService()
llm = OllamaProvider()

runs_router = APIRouter()
memory_router = APIRouter()
analytics_router = APIRouter()
demo_router = APIRouter()
settings_router = APIRouter()


def get_db():
    from app.main import engine
    from app.services.storage.database import get_session
    SessionLocal = get_session(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============ Runs ============

@runs_router.get("", response_model=List[RunSummary])
def list_runs(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
    language: Optional[str] = None,
    status: Optional[str] = None,
    passed: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    repo = RepairRunRepository(db)
    runs = repo.list_runs(limit=limit, offset=offset, language=language, status=status, passed=passed)
    return [
        RunSummary(
            run_id=r.run_id, language=r.language, status=r.status,
            passed=r.passed, iterations=r.iterations,
            confidence_score=r.confidence_score, created_at=r.created_at,
        )
        for r in runs
    ]


@runs_router.get("/{run_id}", response_model=RunDetailResponse)
def get_run_detail(run_id: str, db: Session = Depends(get_db)):
    run_repo = RepairRunRepository(db)
    iter_repo = IterationRepository(db)
    run = run_repo.get_by_run_id(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    iterations = iter_repo.get_by_run_id(run_id)
    iter_details = [
        IterationDetail(
            iteration_number=it.iteration_number, agent_node=it.agent_node,
            error_type=it.error_type, traceback=it.traceback, analysis=it.analysis,
            retrieved_context=it.retrieved_context, proposed_fix_summary=it.proposed_fix_summary,
            test_output=it.test_output, passed=it.passed, confidence_score=it.confidence_score,
            judge_decision=it.judge_decision, created_at=it.created_at,
        )
        for it in iterations
    ]
    return RunDetailResponse(
        run_id=run.run_id, language=run.language, status=run.status,
        original_code=run.original_code, test_code=run.test_code, fixed_code=run.fixed_code,
        passed=run.passed, iterations=run.iterations, confidence_score=run.confidence_score,
        explanation=run.explanation, created_at=run.created_at, completed_at=run.completed_at,
        iteration_details=iter_details,
    )


# ============ Memory ============

@memory_router.post("/search", response_model=List[MemoryRecord])
def search_memory(req: MemorySearchRequest):
    results = memory_service.search_similar(
        query=req.query,
        language=req.language.value if req.language else None,
        error_type=req.error_type,
        limit=req.limit,
    )
    return [
        MemoryRecord(
            id=r["id"], language=r["language"], error_type=r["error_type"],
            traceback_summary=r["traceback_summary"], broken_code_summary=r["broken_code_summary"],
            fix_summary=r["fix_summary"], fixed_code_summary=r["fixed_code_summary"],
            tags=r["tags"], similarity_score=r["similarity_score"], created_at=r.get("created_at"),
        )
        for r in results
    ]


# ============ Analytics ============

@analytics_router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    repo = RepairRunRepository(db)
    data = repo.get_analytics_summary()
    return AnalyticsSummary(memory_hits=0, **data)


@analytics_router.get("/repair-trends")
def get_repair_trends(days: int = Query(default=30, le=365), db: Session = Depends(get_db)):
    repo = RepairRunRepository(db)
    return repo.get_repair_trends(days=days)


@analytics_router.get("/error-distribution")
def get_error_distribution(db: Session = Depends(get_db)):
    repo = RepairRunRepository(db)
    return repo.get_error_distribution()


@analytics_router.get("/language-usage")
def get_language_usage(db: Session = Depends(get_db)):
    repo = RepairRunRepository(db)
    total = repo.count_runs()
    py_count = repo.count_runs(language="PYTHON")
    java_count = repo.count_runs(language="JAVA")
    py_success = repo.count_runs(language="PYTHON", status="COMPLETED")
    java_success = repo.count_runs(language="JAVA", status="COMPLETED")
    return [
        {"language": "Python", "count": py_count, "success_rate": round(py_success / py_count * 100, 1) if py_count else 0},
        {"language": "Java", "count": java_count, "success_rate": round(java_success / java_count * 100, 1) if java_count else 0},
    ]


@analytics_router.get("/confidence-trend")
def get_confidence_trend(days: int = Query(default=30, le=365), db: Session = Depends(get_db)):
    from app.services.storage.database import RepairRun
    from datetime import datetime, timedelta
    from sqlalchemy import func
    start = datetime.utcnow() - timedelta(days=days)
    rows = (db.query(
        func.date(RepairRun.created_at).label("date"),
        func.avg(RepairRun.confidence_score).label("avg_conf")
    ).filter(RepairRun.created_at >= start)
    .group_by(func.date(RepairRun.created_at))
    .order_by(func.date(RepairRun.created_at))
    .all())
    return [{"date": str(r.date), "average_confidence": round(float(r.avg_conf), 3)} for r in rows]


# ============ Demo Cases ============

@demo_router.get("", response_model=List[DemoCase])
def list_demo_cases():
    return DEMO_CASES


@demo_router.get("/{case_id}", response_model=DemoCase)
def get_demo_case_detail(case_id: str):
    case = get_demo_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Demo case not found")
    return case


# ============ Settings ============

@settings_router.get("", response_model=SettingsResponse)
def get_settings():
    import httpx
    def check_health(url: str) -> bool:
        try:
            with httpx.Client(timeout=2.0) as c:
                r = c.get(url)
                return r.status_code < 500
        except Exception:
            return False

    return SettingsResponse(
        llm_provider=settings.llm_provider,
        ollama_model=settings.ollama_model,
        ollama_base_url=settings.ollama_base_url,
        search_provider=settings.search_provider,
        searxng_base_url=settings.searxng_base_url,
        enable_web_search=settings.enable_web_search,
        vector_db=settings.vector_db,
        enable_memory=settings.enable_memory,
        sandbox_provider=settings.sandbox_provider,
        sandbox_timeout_seconds=settings.sandbox_timeout_seconds,
        max_iterations=settings.max_iterations,
        backend_healthy=True,
        ollama_healthy=check_health(f"{settings.ollama_base_url}/api/tags"),
        chromadb_healthy=check_health(f"http://{settings.chroma_host}:{settings.chroma_port}/api/v1/heartbeat"),
        postgres_healthy=True,
    )
