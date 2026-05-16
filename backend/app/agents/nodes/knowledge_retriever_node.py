from app.agents.state import AgentState
from app.services.memory.chroma_service import ChromaMemoryService
from app.services.search.search_service import SearchService
from app.config import settings


memory_service = ChromaMemoryService()
search_service = SearchService()


def knowledge_retriever_node(state: AgentState) -> AgentState:
    context_parts = []

    # Search ChromaDB memory
    if state.use_memory and settings.enable_memory:
        try:
            query = f"{state.language.value} {state.error_type} {state.traceback[:200]}"
            memory_results = memory_service.search_similar(
                query=query,
                language=state.language.value,
                error_type=state.error_type,
                limit=3,
            )
            if memory_results:
                state.memory_hit = True
                context_parts.append("=== Past Similar Fixes ===")
                for i, r in enumerate(memory_results[:2], 1):
                    context_parts.append(
                        f"Fix {i} (similarity: {r['similarity_score']:.2f}):\n"
                        f"  Error: {r['error_type']}\n"
                        f"  Fix: {r['fix_summary']}\n"
                        f"  Code hint: {r['fixed_code_summary'][:200]}"
                    )
        except Exception:
            pass

    # Web search fallback
    if state.use_web_search and settings.enable_web_search:
        try:
            lang_name = "Python" if state.language.value == "PYTHON" else "Java"
            search_query = f"{lang_name} {state.error_type} fix {state.error_message[:100]}"
            web_results = search_service.search(search_query, num_results=3)
            if web_results:
                formatted = search_service.format_context(web_results)
                context_parts.append(formatted)
        except Exception:
            pass

    state.retrieved_context = "\n\n".join(context_parts)
    return state
