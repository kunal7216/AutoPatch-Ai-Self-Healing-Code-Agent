import pytest
from app.agents.nodes.error_analyzer_node import classify_python_error, classify_java_error, extract_traceback
from app.agents.nodes.judge_node import calculate_confidence, detect_new_error
from app.models.enums import Language


class TestErrorAnalyzer:
    def test_classify_type_error(self):
        output = "TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'"
        assert classify_python_error(output) == "TypeError"

    def test_classify_syntax_error(self):
        output = "SyntaxError: invalid syntax"
        assert classify_python_error(output) == "SyntaxError"

    def test_classify_import_error(self):
        output = "ModuleNotFoundError: No module named 'missing_lib'"
        assert classify_python_error(output) == "ImportError"

    def test_classify_assertion_error(self):
        output = "AssertionError: assert 0 == 1"
        assert classify_python_error(output) == "AssertionError"

    def test_classify_unknown(self):
        output = "Some unexpected output"
        assert classify_python_error(output) == "UnknownError"

    def test_classify_java_npe(self):
        output = "java.lang.NullPointerException at StringProcessor.process(StringProcessor.java:5)"
        assert classify_java_error(output) == "NullPointerException"

    def test_classify_java_compilation(self):
        output = "COMPILATION ERROR: cannot find symbol"
        assert classify_java_error(output) == "CompilationError"

    def test_classify_java_junit(self):
        output = "AssertionError: expected: <15> but was: <10>"
        assert classify_java_error(output) == "JUnitAssertionError"

    def test_extract_python_traceback(self):
        output = """
FAILED tests/test_source.py::test_add - TypeError: unsupported operand type
ERROR in test_add
Traceback (most recent call last):
  File "test_source.py", line 3 in test_add
    add(None, 2)
TypeError: unsupported operand type
"""
        tb = extract_traceback(output, Language.PYTHON)
        assert "TypeError" in tb or "FAILED" in tb


class TestJudgeConfidence:
    def test_pass_first_iteration(self):
        score = calculate_confidence(
            passed=True, iterations=1, max_iterations=5,
            memory_hit=False, new_error_introduced=False, timed_out=False,
        )
        assert score >= 0.85

    def test_pass_with_memory_first(self):
        score = calculate_confidence(
            passed=True, iterations=1, max_iterations=5,
            memory_hit=True, new_error_introduced=False, timed_out=False,
        )
        assert score >= 0.90

    def test_pass_many_retries(self):
        score = calculate_confidence(
            passed=True, iterations=4, max_iterations=5,
            memory_hit=False, new_error_introduced=False, timed_out=False,
        )
        assert score < 0.85

    def test_fail_max_iterations(self):
        score = calculate_confidence(
            passed=False, iterations=5, max_iterations=5,
            memory_hit=False, new_error_introduced=False, timed_out=False,
        )
        assert score <= 0.20

    def test_timeout(self):
        score = calculate_confidence(
            passed=False, iterations=1, max_iterations=5,
            memory_hit=False, new_error_introduced=False, timed_out=True,
        )
        assert score == 0.1

    def test_new_error_penalty(self):
        score_no_err = calculate_confidence(
            passed=True, iterations=2, max_iterations=5,
            memory_hit=False, new_error_introduced=False, timed_out=False,
        )
        score_new_err = calculate_confidence(
            passed=True, iterations=2, max_iterations=5,
            memory_hit=False, new_error_introduced=True, timed_out=False,
        )
        assert score_no_err > score_new_err

    def test_detect_new_error(self):
        prev = "AssertionError: expected True got False"
        curr = "ImportError: No module named 'foo'\nAssertionError"
        assert detect_new_error(prev, curr) is True

    def test_no_new_error(self):
        prev = "AssertionError: expected True got False"
        curr = "AssertionError: expected 1 got 0"
        assert detect_new_error(prev, curr) is False


class TestGraphFlow:
    def test_agent_state_defaults(self):
        from app.agents.state import AgentState
        state = AgentState(run_id="test_run", source_code="def foo(): pass", test_code="def test_foo(): pass")
        assert state.iteration == 0
        assert state.passed is False
        assert state.max_iterations == 5

    def test_state_to_iteration_record(self):
        from app.agents.state import AgentState
        state = AgentState(
            run_id="r1",
            source_code="code",
            test_code="test",
            iteration=1,
            error_type="TypeError",
            traceback="TypeError: ...",
            analysis="Type mismatch",
            confidence_score=0.5,
        )
        record = state.to_iteration_record()
        assert record["iteration_number"] == 1
        assert record["error_type"] == "TypeError"
        assert record["confidence_score"] == 0.5
