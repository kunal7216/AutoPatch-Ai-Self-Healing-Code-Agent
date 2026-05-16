from enum import Enum


class Language(str, Enum):
    PYTHON = "PYTHON"
    JAVA = "JAVA"


class RunStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"


class JudgeDecision(str, Enum):
    PASS = "PASS"
    RETRY = "RETRY"
    FAIL = "FAIL"


class PythonErrorType(str, Enum):
    SYNTAX_ERROR = "SyntaxError"
    TYPE_ERROR = "TypeError"
    IMPORT_ERROR = "ImportError"
    ASSERTION_ERROR = "AssertionError"
    LOGIC_ERROR = "LogicError"
    TIMEOUT_ERROR = "TimeoutError"
    RUNTIME_ERROR = "RuntimeError"
    UNKNOWN_ERROR = "UnknownError"


class JavaErrorType(str, Enum):
    COMPILATION_ERROR = "CompilationError"
    PACKAGE_ERROR = "PackageError"
    IMPORT_ERROR = "ImportError"
    NULL_POINTER = "NullPointerException"
    ILLEGAL_ARGUMENT = "IllegalArgumentException"
    JUNIT_ASSERTION = "JUnitAssertionError"
    RUNTIME_EXCEPTION = "RuntimeException"
    LOGIC_ERROR = "LogicError"
    UNKNOWN_ERROR = "UnknownError"


class AgentNode(str, Enum):
    TEST_RUNNER = "TestRunner"
    ERROR_ANALYZER = "ErrorAnalyzer"
    KNOWLEDGE_RETRIEVER = "KnowledgeRetriever"
    CODE_FIXER = "CodeFixer"
    JUDGE = "Judge"
    MEMORY_WRITER = "MemoryWriter"
