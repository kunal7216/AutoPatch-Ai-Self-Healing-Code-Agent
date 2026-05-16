from sqlalchemy import create_engine, Column, String, Boolean, Float, Integer, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class RepairRun(Base):
    __tablename__ = "repair_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), unique=True, nullable=False, default=generate_uuid)
    language = Column(String(16), nullable=False)
    status = Column(String(32), nullable=False, default="QUEUED")
    original_code = Column(Text, nullable=False)
    test_code = Column(Text, nullable=False)
    dependency_file = Column(Text, nullable=True)
    fixed_code = Column(Text, nullable=True)
    passed = Column(Boolean, default=False)
    iterations = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)
    explanation = Column(Text, nullable=True)
    error_type = Column(String(64), nullable=True)
    use_memory = Column(Boolean, default=True)
    use_web_search = Column(Boolean, default=True)
    max_iterations = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class RepairIteration(Base):
    __tablename__ = "repair_iterations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), nullable=False)
    iteration_number = Column(Integer, nullable=False)
    agent_node = Column(String(64), nullable=True)
    error_type = Column(String(64), nullable=True)
    traceback = Column(Text, nullable=True)
    analysis = Column(Text, nullable=True)
    retrieved_context = Column(Text, nullable=True)
    proposed_fix_summary = Column(Text, nullable=True)
    test_output = Column(Text, nullable=True)
    passed = Column(Boolean, default=False)
    confidence_score = Column(Float, default=0.0)
    judge_decision = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MemoryRecord(Base):
    __tablename__ = "memory_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chroma_id = Column(String(64), unique=True, nullable=False, default=generate_uuid)
    language = Column(String(16), nullable=False)
    error_type = Column(String(64), nullable=False)
    traceback_summary = Column(Text, nullable=True)
    broken_code_summary = Column(Text, nullable=True)
    fix_summary = Column(Text, nullable=True)
    fixed_code_summary = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_engine(database_url: str):
    return create_engine(database_url, echo=False)


def init_db(database_url: str):
    engine = get_engine(database_url)
    Base.metadata.create_all(bind=engine)
    return engine


def get_session(engine):
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal
