from app.agents.state import AgentState
from app.models.enums import JudgeDecision


def calculate_confidence(
    passed: bool,
    iterations: int,
    max_iterations: int,
    memory_hit: bool,
    new_error_introduced: bool,
    timed_out: bool,
) -> float:
    if timed_out:
        return 0.1

    if not passed:
        if iterations >= max_iterations:
            return 0.15
        base = 0.25 - (iterations * 0.03)
        if new_error_introduced:
            base -= 0.05
        return max(0.05, base)

    # Tests passed
    score = 0.85
    if memory_hit:
        score += 0.05
    if iterations == 1:
        score += 0.05
    else:
        score -= (iterations - 1) * 0.03
    if new_error_introduced:
        score -= 0.10
    if iterations >= max_iterations:
        score = min(score, 0.65)

    return round(max(0.0, min(1.0, score)), 3)


def detect_new_error(previous_output: str, current_output: str) -> bool:
    """Check if a new error type was introduced compared to previous output."""
    error_markers = ["ImportError", "SyntaxError", "NameError", "AttributeError",
                     "NullPointerException", "COMPILATION ERROR"]
    prev_errors = {e for e in error_markers if e in previous_output}
    curr_errors = {e for e in error_markers if e in current_output}
    return bool(curr_errors - prev_errors)


def judge_node(state: AgentState) -> AgentState:
    if state.passed:
        state.judge_decision = JudgeDecision.PASS
        state.confidence_score = calculate_confidence(
            passed=True,
            iterations=state.iteration,
            max_iterations=state.max_iterations,
            memory_hit=state.memory_hit,
            new_error_introduced=False,
            timed_out=False,
        )
        return state

    # Check for max iterations
    if state.iteration >= state.max_iterations:
        state.judge_decision = JudgeDecision.FAIL
        state.confidence_score = calculate_confidence(
            passed=False,
            iterations=state.iteration,
            max_iterations=state.max_iterations,
            memory_hit=state.memory_hit,
            new_error_introduced=False,
            timed_out=state.timed_out,
        )
        return state

    # Check if new error was introduced
    new_error = False
    if state.iteration_history:
        prev_output = state.iteration_history[-1].get("test_output", "")
        new_error = detect_new_error(prev_output, state.test_output)

    state.confidence_score = calculate_confidence(
        passed=False,
        iterations=state.iteration,
        max_iterations=state.max_iterations,
        memory_hit=state.memory_hit,
        new_error_introduced=new_error,
        timed_out=state.timed_out,
    )

    state.judge_decision = JudgeDecision.RETRY
    return state
