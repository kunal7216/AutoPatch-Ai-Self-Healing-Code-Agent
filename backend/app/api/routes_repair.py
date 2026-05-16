import uuid
import asyncio
import json
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.models.schemas import RepairRequest, RepairResponse, RunDetailResponse, IterationDetail
from app.models.enums import Language
from app.agents.graph import RepairGraph
from app.agents.state import AgentState
from app.services.storage.database import get_engine, get_session, init_db
from app.services.storage.repositories import RepairRunRepository, IterationRepository
from app.config import settings

import structlog

logger = structlog.get_logger()

router = APIRouter()

# In-memory event store for SSE
_event_store: dict[str, list] = {}


def get_db():
    from app.main import engine
    SessionLocal = get_session(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _push_event(run_id: str, event: str, data):
    if run_id not in _event_store:
        _event_store[run_id] = []
    _event_store[run_id].append({"event": event, "data": data})


async def _run_repair_task(run_id: str, request: RepairRequest, db_url: str):
    from app.services.storage.database import get_engine, get_session
    engine = get_engine(db_url)
    SessionLocal = get_session(engine)
    db = SessionLocal()

    run_repo = RepairRunRepository(db)
    iter_repo = IterationRepository(db)

    try:
        run_repo.update_status(run_id, "RUNNING")
        _push_event(run_id, "status_change", {"status": "RUNNING"})

        state = AgentState(
            run_id=run_id,
            language=request.language,
            source_code=request.source_code,
            test_code=request.test_code,
            dependency_file=request.dependency_file,
            max_iterations=request.max_iterations,
            use_memory=request.use_memory,
            use_web_search=request.use_web_search,
        )

        def event_cb(rid, event, data):
            _push_event(rid, event, data)

        graph = RepairGraph(event_callback=event_cb)
        final_state = graph.run(state)

        # Save iterations
        for iter_record in final_state.iteration_history:
            iter_repo.create(run_id=run_id, **iter_record)

        final_status = "COMPLETED" if final_state.passed else "FAILED"
        run_repo.update_result(
            run_id=run_id,
            fixed_code=final_state.current_code if final_state.passed else None,
            passed=final_state.passed,
            confidence_score=final_state.confidence_score,
            explanation=final_state.explanation,
            iterations=final_state.iteration,
            status=final_status,
            error_type=final_state.error_type,
        )
        _push_event(run_id, "done", {"status": final_status})

    except Exception as e:
        logger.error("repair_task_error", run_id=run_id, error=str(e))
        run_repo.update_status(run_id, "FAILED")
        _push_event(run_id, "error", {"message": str(e)})
    finally:
        db.close()
        engine.dispose()


@router.post("/repair", response_model=RepairResponse)
async def submit_repair(request: RepairRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    run_repo = RepairRunRepository(db)
    run_repo.create(
        run_id=run_id,
        language=request.language.value,
        source_code=request.source_code,
        test_code=request.test_code,
        dependency_file=request.dependency_file,
        max_iterations=request.max_iterations,
        use_memory=request.use_memory,
        use_web_search=request.use_web_search,
    )

    background_tasks.add_task(
        _run_repair_task,
        run_id=run_id,
        request=request,
        db_url=settings.database_url,
    )

    return RepairResponse(run_id=run_id, status="QUEUED")


@router.get("/repair/{run_id}", response_model=RunDetailResponse)
def get_repair_result(run_id: str, db: Session = Depends(get_db)):
    run_repo = RepairRunRepository(db)
    iter_repo = IterationRepository(db)
    run = run_repo.get_by_run_id(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    iterations = iter_repo.get_by_run_id(run_id)
    iter_details = [
        IterationDetail(
            iteration_number=it.iteration_number,
            agent_node=it.agent_node,
            error_type=it.error_type,
            traceback=it.traceback,
            analysis=it.analysis,
            retrieved_context=it.retrieved_context,
            proposed_fix_summary=it.proposed_fix_summary,
            test_output=it.test_output,
            passed=it.passed,
            confidence_score=it.confidence_score,
            judge_decision=it.judge_decision,
            created_at=it.created_at,
        )
        for it in iterations
    ]

    return RunDetailResponse(
        run_id=run.run_id,
        language=run.language,
        status=run.status,
        original_code=run.original_code,
        test_code=run.test_code,
        fixed_code=run.fixed_code,
        passed=run.passed,
        iterations=run.iterations,
        confidence_score=run.confidence_score,
        explanation=run.explanation,
        created_at=run.created_at,
        completed_at=run.completed_at,
        iteration_details=iter_details,
    )


@router.get("/repair/{run_id}/events")
async def stream_repair_events(run_id: str):
    async def event_generator():
        sent_idx = 0
        max_polls = 300  # 5 minutes at 1s intervals
        polls = 0

        while polls < max_polls:
            events = _event_store.get(run_id, [])
            while sent_idx < len(events):
                ev = events[sent_idx]
                yield f"event: {ev['event']}\ndata: {json.dumps(ev['data'])}\n\n"
                sent_idx += 1
                if ev["event"] in ("done", "error"):
                    return
            await asyncio.sleep(1)
            polls += 1

        yield "event: timeout\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
