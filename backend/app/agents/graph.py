from typing import Callable, Any
from app.agents.state import AgentState
from app.agents.nodes.test_runner_node import test_runner_node
from app.agents.nodes.error_analyzer_node import error_analyzer_node
from app.agents.nodes.knowledge_retriever_node import knowledge_retriever_node
from app.agents.nodes.code_fixer_node import code_fixer_node
from app.agents.nodes.judge_node import judge_node
from app.agents.nodes.memory_writer_node import memory_writer_node
from app.models.enums import JudgeDecision
from app.services.llm.ollama_provider import OllamaProvider


llm = OllamaProvider()


class RepairGraph:
    """
    LangGraph-style agent loop for code repair.
    Implements: TestRunner → ErrorAnalyzer → KnowledgeRetriever → CodeFixer → Judge
    Loops back if RETRY, terminates on PASS or FAIL.
    """

    def __init__(self, event_callback: Callable[[str, str, Any], None] = None):
        self.event_callback = event_callback or (lambda *args: None)

    def _emit(self, run_id: str, event: str, data: Any = None):
        try:
            self.event_callback(run_id, event, data)
        except Exception:
            pass

    def run(self, state: AgentState) -> AgentState:
        self._emit(state.run_id, "started", {"run_id": state.run_id})

        # Initialize current code
        state.current_code = state.source_code

        while state.iteration < state.max_iterations:
            state.iteration += 1
            self._emit(state.run_id, "iteration_start", {
                "iteration": state.iteration,
                "max": state.max_iterations,
            })

            # Step 1: Run Tests
            self._emit(state.run_id, "node_start", {"node": "TestRunner", "iteration": state.iteration})
            state = test_runner_node(state)
            self._emit(state.run_id, "node_complete", {
                "node": "TestRunner",
                "passed": state.passed,
                "exit_code": state.exit_code,
            })

            if state.passed:
                self._emit(state.run_id, "tests_passed", {"iteration": state.iteration})
                break

            # Step 2: Analyze Error
            self._emit(state.run_id, "node_start", {"node": "ErrorAnalyzer", "iteration": state.iteration})
            state = error_analyzer_node(state)
            self._emit(state.run_id, "node_complete", {
                "node": "ErrorAnalyzer",
                "error_type": state.error_type,
                "analysis": state.analysis[:200] if state.analysis else "",
            })

            # Step 3: Retrieve Knowledge
            self._emit(state.run_id, "node_start", {"node": "KnowledgeRetriever", "iteration": state.iteration})
            state = knowledge_retriever_node(state)
            self._emit(state.run_id, "node_complete", {
                "node": "KnowledgeRetriever",
                "memory_hit": state.memory_hit,
                "context_length": len(state.retrieved_context),
            })

            # Step 4: Fix Code
            self._emit(state.run_id, "node_start", {"node": "CodeFixer", "iteration": state.iteration})
            state = code_fixer_node(state)
            self._emit(state.run_id, "node_complete", {
                "node": "CodeFixer",
                "fix_summary": state.fix_summary,
            })

            # Step 5: Judge
            self._emit(state.run_id, "node_start", {"node": "Judge", "iteration": state.iteration})
            state = judge_node(state)
            self._emit(state.run_id, "node_complete", {
                "node": "Judge",
                "decision": state.judge_decision.value,
                "confidence": state.confidence_score,
            })

            # Record this iteration
            state.iteration_history.append(state.to_iteration_record())

            if state.judge_decision == JudgeDecision.FAIL:
                break

        # Final test run if last iteration fixed something
        if not state.passed and state.iteration < state.max_iterations:
            self._emit(state.run_id, "node_start", {"node": "TestRunner", "iteration": state.iteration})
            state = test_runner_node(state)
            if state.passed:
                state.judge_decision = JudgeDecision.PASS
                state = judge_node(state)

        # Write to memory if passed
        if state.passed:
            self._emit(state.run_id, "node_start", {"node": "MemoryWriter", "iteration": state.iteration})
            state = memory_writer_node(state)
            self._emit(state.run_id, "node_complete", {"node": "MemoryWriter"})

            # Generate explanation
            try:
                state.explanation = llm.generate_explanation(
                    language=state.language.value,
                    broken_code=state.source_code,
                    fixed_code=state.current_code,
                    error_type=state.error_type,
                )
            except Exception:
                state.explanation = f"Fixed {state.error_type} in {state.iteration} iteration(s)."
        else:
            state.explanation = (
                f"Could not automatically fix the {state.error_type} after {state.iteration} attempts. "
                f"Manual review required."
            )

        final_status = "PASS" if state.passed else "FAIL"
        self._emit(state.run_id, "completed", {
            "passed": state.passed,
            "iterations": state.iteration,
            "confidence": state.confidence_score,
            "status": final_status,
        })

        return state
