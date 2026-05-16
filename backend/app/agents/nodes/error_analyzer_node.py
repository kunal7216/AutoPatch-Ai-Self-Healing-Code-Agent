import re
from app.agents.state import AgentState
from app.models.enums import Language
from app.services.llm.ollama_provider import OllamaProvider


llm = OllamaProvider()

PYTHON_ERROR_PATTERNS = {
    "SyntaxError": r"SyntaxError",
    "TypeError": r"TypeError",
    "ImportError": r"(ImportError|ModuleNotFoundError)",
    "AssertionError": r"AssertionError",
    "TimeoutError": r"TimeoutError",
    "RuntimeError": r"RuntimeError",
}

JAVA_ERROR_PATTERNS = {
    "CompilationError": r"(COMPILATION ERROR|cannot find symbol|error:)",
    "NullPointerException": r"NullPointerException",
    "IllegalArgumentException": r"IllegalArgumentException",
    "JUnitAssertionError": r"(AssertionError|expected:|but was:|junit)",
    "RuntimeException": r"RuntimeException",
    "ImportError": r"(import|package) .* does not exist",
}


def classify_python_error(output: str) -> str:
    for error_type, pattern in PYTHON_ERROR_PATTERNS.items():
        if re.search(pattern, output, re.IGNORECASE):
            return error_type
    if "FAILED" in output or "failed" in output:
        return "LogicError"
    return "UnknownError"


def classify_java_error(output: str) -> str:
    for error_type, pattern in JAVA_ERROR_PATTERNS.items():
        if re.search(pattern, output, re.IGNORECASE):
            return error_type
    if "BUILD FAILURE" in output:
        return "LogicError"
    return "UnknownError"


def extract_traceback(output: str, language: Language) -> str:
    if language == Language.PYTHON:
        lines = output.split("\n")
        traceback_lines = []
        capturing = False
        for line in lines:
            if "FAILED" in line or "ERROR" in line or "Traceback" in line:
                capturing = True
            if capturing:
                traceback_lines.append(line)
                if len(traceback_lines) > 30:
                    break
        return "\n".join(traceback_lines) if traceback_lines else output[:1000]
    else:
        # Java: extract relevant failure lines
        lines = output.split("\n")
        relevant = [l for l in lines if any(k in l for k in
                    ["ERROR", "FAILURE", "Exception", "AssertionError", "expected", "but was", "at com.autopatch"])]
        return "\n".join(relevant[:20]) if relevant else output[:1000]


def extract_failing_function(output: str, language: Language) -> str:
    if language == Language.PYTHON:
        match = re.search(r"def (\w+)\(", output)
        if match:
            return match.group(1)
        match = re.search(r"FAILED .+::(\w+)", output)
        if match:
            return match.group(1)
    else:
        match = re.search(r"(\w+)\(\) .+Exception", output)
        if match:
            return match.group(1)
    return "unknown"


def error_analyzer_node(state: AgentState) -> AgentState:
    if state.passed:
        return state

    output = state.test_output

    if state.language == Language.PYTHON:
        state.error_type = classify_python_error(output)
    else:
        state.error_type = classify_java_error(output)

    state.traceback = extract_traceback(output, state.language)
    state.failing_function = extract_failing_function(output, state.language)

    # Use LLM for deeper analysis
    try:
        code = state.current_code if state.current_code else state.source_code
        state.analysis = llm.analyze_error(state.language.value, state.test_output, code)
    except Exception:
        state.analysis = f"Error Type: {state.error_type}. See traceback for details."

    return state
