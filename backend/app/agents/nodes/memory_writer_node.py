from app.agents.state import AgentState
from app.services.memory.chroma_service import ChromaMemoryService
from app.config import settings


memory_service = ChromaMemoryService()


def memory_writer_node(state: AgentState) -> AgentState:
    if not state.passed or not settings.enable_memory:
        return state

    try:
        code_to_store = state.current_code or state.proposed_fix
        traceback_summary = state.traceback[:300] if state.traceback else ""
        broken_summary = state.source_code[:300] if state.source_code else ""
        fixed_summary = code_to_store[:300] if code_to_store else ""
        fix_summary = state.fix_summary or f"Fixed {state.error_type}"

        tags = [state.language.value, state.error_type]
        if state.failing_function and state.failing_function != "unknown":
            tags.append(state.failing_function)

        memory_service.store_fix(
            language=state.language.value,
            error_type=state.error_type,
            traceback_summary=traceback_summary,
            broken_code_summary=broken_summary,
            fix_summary=fix_summary,
            fixed_code_summary=fixed_summary,
            tags=tags,
        )
    except Exception:
        pass  # Memory storage is non-critical

    return state
