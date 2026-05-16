from app.agents.state import AgentState
from app.services.sandbox.docker_sandbox import DockerSandbox


sandbox = DockerSandbox()


def test_runner_node(state: AgentState) -> AgentState:
    code_to_test = state.current_code if state.current_code else state.source_code

    result = sandbox.run_tests(
        language=state.language,
        source_code=code_to_test,
        test_code=state.test_code,
        dependency_file=state.dependency_file,
    )

    state.test_output = result.combined_output
    state.exit_code = result.exit_code
    state.timed_out = result.timed_out
    state.passed = result.passed

    if result.timed_out:
        state.error_type = "TimeoutError"
        state.traceback = "Execution timed out"
    elif result.error:
        state.error = result.error

    return state
