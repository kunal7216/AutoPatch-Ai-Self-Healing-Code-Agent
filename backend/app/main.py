from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.config import settings
from app.api.routes_repair import router as repair_router
from app.api.routes_all import (
    runs_router, memory_router, analytics_router,
    demo_router, settings_router,
)
from app.services.storage.database import init_db

logger = structlog.get_logger()

app = FastAPI(
    title="AutoPatch AI",
    description="Free Local Multi-Language Self-Healing Code Agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
engine = init_db(settings.database_url)

# Routes
app.include_router(repair_router, prefix="/api/v1")
app.include_router(runs_router, prefix="/api/v1/runs", tags=["runs"])
app.include_router(memory_router, prefix="/api/v1/memory", tags=["memory"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(demo_router, prefix="/api/v1/demo-cases", tags=["demo"])
app.include_router(settings_router, prefix="/api/v1/settings", tags=["settings"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.on_event("startup")
async def startup():
    logger.info("AutoPatch AI backend started", model=settings.ollama_model)
