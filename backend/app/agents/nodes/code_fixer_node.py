from app.agents.state import AgentState
from app.services.llm.ollama_provider import OllamaProvider


llm = OllamaProvider()


def clean_llm_output(output: str, language: str) -> str:
    """Strip markdown fences and normalize output."""
    lines = output.strip().split("\n")
    cleaned = []
    in_fence = False

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence and stripped.startswith("```"):
            continue
        cleaned.append(line)

    result = "\n".join(cleaned).strip()

    # Remove leading language identifier lines
    if result.startswith(language.lower()):
        result = "\n".join(result.split("\n")[1:]).strip()

    return result if result else output


def code_fixer_node(state: AgentState) -> AgentState:
    if state.passed:
        return state

    code_to_fix = state.current_code if state.current_code else state.source_code

    try:
        raw_fix = llm.generate_fix(
            language=state.language.value,
            broken_code=code_to_fix,
            test_code=state.test_code,
            error_type=state.error_type,
            traceback=state.traceback,
            context=state.retrieved_context,
        )

        fixed_code = clean_llm_output(raw_fix, state.language.value)

        # Validate it's not empty
        if not fixed_code or len(fixed_code.strip()) < 10:
            fixed_code = code_to_fix

        state.proposed_fix = fixed_code
        state.current_code = fixed_code
        state.fix_summary = _summarize_fix(code_to_fix, fixed_code)

    except Exception as e:
        state.error = f"Code fixer error: {str(e)}"
        state.proposed_fix = code_to_fix
        state.current_code = code_to_fix

    return state


def _summarize_fix(original: str, fixed: str) -> str:
    orig_lines = set(original.split("\n"))
    fixed_lines = set(fixed.split("\n"))
    added = fixed_lines - orig_lines
    removed = orig_lines - fixed_lines
    parts = []
    if added:
        sample_added = list(added)[:2]
        parts.append(f"Added: {'; '.join(l.strip() for l in sample_added if l.strip())}")
    if removed:
        sample_removed = list(removed)[:2]
        parts.append(f"Removed: {'; '.join(l.strip() for l in sample_removed if l.strip())}")
    return ". ".join(parts) if parts else "Code modified"
