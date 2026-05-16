from pydantic_settings import BaseSettings
from typing import Literal, Optional


class Settings(BaseSettings):
    # LLM
    llm_provider: str = "ollama"
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "qwen2.5-coder:7b"
    ollama_timeout: float = 120.0
    ollama_retries: int = 3

    # Search
    search_provider: str = "searxng"
    searxng_base_url: str = "http://searxng:8080"
    enable_web_search: bool = True

    # Vector DB
    vector_db: str = "chromadb"
    chroma_host: str = "chromadb"
    chroma_port: int = 8000
    enable_memory: bool = True

    # Database
    database_url: str = "postgresql://autopatch:autopatch@postgres:5432/autopatch"

    # Redis (for Celery task queue)
    redis_url: str = "redis://redis:6379/0"
    use_celery: bool = False  # False = use FastAPI background tasks (simpler), True = Celery

    # Sandbox
    sandbox_provider: str = "docker"
    sandbox_timeout_seconds: int = 20
    sandbox_memory_limit: str = "512m"
    sandbox_cpu_limit: float = 1.0

    # Agent
    max_iterations: int = 5

    # Rate limiting
    repair_rate_limit: str = "10/minute"

    # Webhook (optional: POST result to this URL when repair completes)
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
