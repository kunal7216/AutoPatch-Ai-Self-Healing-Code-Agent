from typing import Optional, List, Any
from dataclasses import dataclass, field
from app.models.enums import Language, JudgeDecision


@dataclass
class AgentState:
    # Input
    run_id: str = ""
    language: Language = Language.PYTHON
    source_code: str = ""
    test_code: str = ""
    dependency_file: Optional[str] = None
    max_iterations: int = 5
    use_memory: bool = True
    use_web_search: bool = True

    # Test Execution
    current_code: str = ""
    test_output: str = ""
    exit_code: int = -1
    timed_out: bool = False

    # Error Analysis
    error_type: str = "UnknownError"
    error_message: str = ""
    traceback: str = ""
    failing_function: str = ""
    failing_line: int = 0
    analysis: str = ""

    # Knowledge
    retrieved_context: str = ""
    memory_hit: bool = False

    # Fix
    proposed_fix: str = ""
    fix_summary: str = ""

    # Judge
    judge_decision: JudgeDecision = JudgeDecision.RETRY
    confidence_score: float = 0.0
    passed: bool = False

    # Iteration tracking
    iteration: int = 0
    iteration_history: List[dict] = field(default_factory=list)

    # Output
    explanation: str = ""
    error: Optional[str] = None

    def to_iteration_record(self) -> dict:
        return {
            "iteration_number": self.iteration,
            "error_type": self.error_type,
            "traceback": self.traceback[:2000] if self.traceback else "",
            "analysis": self.analysis,
            "retrieved_context": self.retrieved_context[:1000] if self.retrieved_context else "",
            "proposed_fix_summary": self.fix_summary,
            "test_output": self.test_output[:3000] if self.test_output else "",
            "passed": self.passed,
            "confidence_score": self.confidence_score,
            "judge_decision": self.judge_decision.value if self.judge_decision else None,
        }
