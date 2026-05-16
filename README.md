# AutoPatch AI

**Free Local Multi-Language Self-Healing Code Agent**

AutoPatch AI is a free, locally runnable, multi-language self-healing code agent that reads failing tests, analyzes errors, retrieves relevant knowledge, fixes broken Python or Java code, reruns tests in a secure Docker sandbox, and repeats until the code passes or the retry limit is reached.

---

## Why This Project Matters

Most code repair tools require paid API keys (OpenAI, Claude, Gemini) or paid execution environments (E2B, Replit). AutoPatch AI is entirely free — it runs locally using Ollama for LLM inference, Docker for sandboxed execution, ChromaDB for vector memory, and SearXNG for web search. No credit card required.

---

## Free Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Ollama (`qwen2.5-coder:7b`) |
| Agent Framework | LangGraph + LangChain Core |
| Backend | FastAPI + Python 3.11 |
| Sandbox | Docker SDK for Python |
| Vector Memory | ChromaDB |
| Web Search | SearXNG (self-hosted) + DuckDuckGo fallback |
| Database | PostgreSQL + SQLAlchemy |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Monitoring | Recharts (analytics dashboard) |
| Deployment | Docker Compose |

---

## Architecture

```
User Uploads Code + Tests
         │
         ▼
React Developer Dashboard (Port 3000)
         │
         ▼
FastAPI Backend (Port 8000)
         │
         ▼
LangGraph Agent
         │
         ├──▶ Test Runner Node
         │         ├──▶ Docker Python Sandbox (pytest)
         │         └──▶ Docker Java Sandbox (mvn test)
         │
         ├──▶ Error Analyzer Node
         │         └──▶ Classifies error types
         │
         ├──▶ Knowledge Retriever Node
         │         ├──▶ ChromaDB Vector Memory
         │         └──▶ SearXNG / DuckDuckGo Search
         │
         ├──▶ Code Fixer Node
         │         └──▶ Ollama Local LLM
         │
         ├──▶ Judge Node
         │         └──▶ PASS / RETRY / FAIL + Confidence Score
         │
         └──▶ Memory Writer Node
                   └──▶ Stores fix in ChromaDB + PostgreSQL
```

---

## Agent Loop

```
User submits broken code + tests
              ↓
Agent runs tests in Docker sandbox
              ↓
Agent reads traceback / stack trace
              ↓
Agent classifies error type
              ↓
Agent searches ChromaDB memory + SearXNG
              ↓
Agent generates fix using Ollama
              ↓
Agent reruns tests
              ↓
Judge → PASS / RETRY / FAIL
              ↓
If PASS: store fix in memory, return result
If RETRY: loop back (up to 5 iterations)
If FAIL: return best attempt with explanation
```

---

## Supported Languages

### Python
- Source files: `.py`
- Test framework: `pytest`
- Test command: `python -m pytest --timeout=15 -v --tb=short`

### Java
- Source files: `.java`
- Test framework: JUnit 5
- Build tool: Maven
- Test command: `mvn test -q`

---

## Folder Structure

```
autopatch-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── config.py                # Settings (pydantic-settings)
│   │   ├── demo_cases.py            # Built-in demo cases
│   │   ├── api/
│   │   │   ├── routes_repair.py     # POST /repair, GET /repair/{id}/events
│   │   │   └── routes_all.py        # runs, memory, analytics, demo, settings
│   │   ├── agents/
│   │   │   ├── graph.py             # LangGraph-style repair loop
│   │   │   ├── state.py             # AgentState dataclass
│   │   │   └── nodes/
│   │   │       ├── test_runner_node.py
│   │   │       ├── error_analyzer_node.py
│   │   │       ├── knowledge_retriever_node.py
│   │   │       ├── code_fixer_node.py
│   │   │       ├── judge_node.py
│   │   │       └── memory_writer_node.py
│   │   ├── services/
│   │   │   ├── sandbox/docker_sandbox.py
│   │   │   ├── llm/ollama_provider.py
│   │   │   ├── search/search_service.py
│   │   │   ├── memory/chroma_service.py
│   │   │   └── storage/
│   │   │       ├── database.py      # SQLAlchemy models
│   │   │       └── repositories.py  # DB access layer
│   │   ├── models/
│   │   │   ├── schemas.py           # Pydantic models
│   │   │   └── enums.py             # Language, Status, etc.
│   │   └── tests/test_all.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/App.tsx              # Router
│   │   ├── features/               # Pages
│   │   ├── components/             # Reusable components
│   │   ├── services/api.ts         # Axios API client
│   │   ├── store/repairStore.ts    # Zustand state
│   │   └── types/index.ts          # TypeScript types
│   └── Dockerfile
├── sandbox/
│   ├── python/Dockerfile           # pytest sandbox image
│   └── java/Dockerfile             # Maven/JUnit sandbox image
├── infra/searxng/settings.yml
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Docker + Docker Compose
- 8GB+ RAM recommended (for Ollama LLM)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourname/autopatch-ai
cd autopatch-ai
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 3. Start all services

```bash
docker compose up --build
```

This starts: backend, frontend, postgres, chromadb, searxng, ollama, and builds sandbox images.

### 4. Pull the LLM model (one-time, ~4GB)

```bash
docker exec -it autopatch-ollama ollama pull qwen2.5-coder:7b
```

Alternative models (all free):
```bash
docker exec -it autopatch-ollama ollama pull deepseek-coder:6.7b
docker exec -it autopatch-ollama ollama pull codellama:7b
```

### 5. Open the dashboard

```
http://localhost:3000
```

Backend API docs: `http://localhost:8000/docs`

---

## Ollama Setup (Manual)

If you prefer to run Ollama outside Docker:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model
ollama pull qwen2.5-coder:7b

# Update .env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

---

## API Documentation

### Submit Repair
```
POST /api/v1/repair
Content-Type: application/json

{
  "language": "PYTHON",
  "source_code": "def add(a, b): return a + b",
  "test_code": "from source import add\ndef test_add(): assert add(None, 2) == 2",
  "max_iterations": 5,
  "use_memory": true,
  "use_web_search": true
}

Response: { "run_id": "run_abc123", "status": "QUEUED" }
```

### Stream Repair Events (SSE)
```
GET /api/v1/repair/{runId}/events
```

Events: `started`, `iteration_start`, `node_start`, `node_complete`, `tests_passed`, `completed`, `error`, `done`

### Get Result
```
GET /api/v1/repair/{runId}
GET /api/v1/runs/{runId}
```

### Memory Search
```
POST /api/v1/memory/search
{ "query": "NullPointerException", "language": "JAVA", "limit": 10 }
```

### Analytics
```
GET /api/v1/analytics/summary
GET /api/v1/analytics/repair-trends?days=30
GET /api/v1/analytics/error-distribution
GET /api/v1/analytics/language-usage
GET /api/v1/analytics/confidence-trend
```

---

## Sandbox Security

| Control | Implementation |
|---------|---------------|
| Isolation | Ephemeral Docker containers, deleted after run |
| Network | Disabled inside sandbox (`network_disabled=True`) |
| Commands | Allowlist only: `python -m pytest`, `mvn test` |
| Filesystem | Only `/tmp/autopatch/<uuid>` mounted, read-write |
| CPU | Capped via `nano_cpus` (default: 1 vCPU) |
| Memory | Limited via `mem_limit` (default: 512MB) |
| Timeout | Hard kill after N seconds (default: 20s) |
| Privileges | `no-new-privileges` security option |
| Cleanup | Workspace and container removed after every run |

---

## Demo Cases

| ID | Language | Error Type | Difficulty |
|----|----------|-----------|-----------|
| py-type-error | Python | TypeError | Easy |
| py-logic-error | Python | LogicError | Easy |
| py-assertion-error | Python | AssertionError | Medium |
| py-import-error | Python | ImportError | Easy |
| py-string-parse | Python | AssertionError | Medium |
| java-npe | Java | NullPointerException | Easy |
| java-assertion | Java | JUnitAssertionError | Medium |
| java-string-parse | Java | JUnitAssertionError | Medium |

---

## Confidence Score Formula

```
Base (tests pass):      0.85
Memory hit found:      +0.05
Fixed in 1 iteration:  +0.05
Each additional retry: -0.03
New error introduced:  -0.10
Timeout:               → 0.10 (capped)
Max iterations hit:    → capped at 0.65
```

---

## Limitations

- LLM quality depends on the local model; larger models give better results
- Java sandbox requires Maven to download dependencies on first run (slow)
- ChromaDB vector search quality depends on embedding similarity
- Web search is best-effort; SearXNG may need configuration for some regions
- The agent cannot run multi-file projects without adaptation

---

## Future Improvements

- GitHub PR bot integration (auto-repair failing CI)
- Support for additional languages (JavaScript, Go, Rust)
- Multi-file project support
- Fine-tuned model on repair dataset
- Parallel sandbox execution
- Visual agent debugger
- Export repairs as GitHub Gists

---

## FAANG Interview Talking Points

1. **Infinite loop prevention**: `max_iterations` cap + Judge FAIL decision terminate the loop
2. **Why Docker sandboxing**: Untrusted code execution requires strict isolation; prevents host filesystem access, network calls, and privilege escalation
3. **No arbitrary LLM commands**: Only allowlisted commands (`python -m pytest`, `mvn test`) are passed to Docker; LLM output goes to source code only
4. **LangGraph control flow**: Graph nodes are pure functions on a shared state object; the loop is driven by the Judge node's decision
5. **Confidence scoring**: Multi-factor scoring combining pass/fail, iteration count, memory hits, and new error detection
6. **Memory for improvement**: ChromaDB stores successful fixes as embeddings; cosine similarity retrieves relevant past solutions
7. **Python vs Java repair**: Python uses pytest stdout parsing; Java uses Maven build output and JUnit XML; error classification patterns differ
8. **Scaling**: Replace background tasks with Celery workers; use a pool of pre-warmed Docker containers; add Redis for event brokering
9. **GitHub PR bot**: Trigger repair on failed CI webhook; commit fix to a branch; open PR with explanation and confidence score
10. **Agentic AI demonstration**: Shows tool use (Docker, LLM, search, DB), evaluation (Judge), memory (ChromaDB), and self-correction (retry loop)

---

## Resume Bullets

- Built **AutoPatch AI**, a free local multi-language self-healing code agent using **LangGraph, FastAPI, Ollama, Docker sandboxing, ChromaDB, and React** to automatically repair failing Python and Java code with zero paid API dependencies
- Designed a **six-node agentic repair loop** (Test Runner, Error Analyzer, Knowledge Retriever, Code Fixer, Judge, Memory Writer) that iteratively fixes code until pytest/JUnit tests pass, with configurable retry limits and confidence scoring
- Implemented **secure Docker-based sandbox execution** for pytest and Maven/JUnit with network isolation, CPU/memory limits, command allowlisting, and automatic cleanup — preventing arbitrary code execution on the host
- Added **ChromaDB vector memory** with cosine similarity search to retrieve successful historical fixes, reducing LLM hallucinations and improving repair accuracy on recurring error patterns
- Built a **production-grade React developer dashboard** with Monaco-style code editors, live agent timeline via Server-Sent Events, diff viewer, repair history, memory browser, and Recharts analytics
- Integrated **SearXNG + DuckDuckGo fallback** web search for retrieval-augmented repair context, with graceful degradation when search is unavailable
