from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from app.services.storage.database import RepairRun, RepairIteration, MemoryRecord


class RepairRunRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, run_id: str, language: str, source_code: str, test_code: str,
               dependency_file: Optional[str] = None, max_iterations: int = 5,
               use_memory: bool = True, use_web_search: bool = True) -> RepairRun:
        run = RepairRun(
            run_id=run_id,
            language=language,
            status="QUEUED",
            original_code=source_code,
            test_code=test_code,
            dependency_file=dependency_file,
            max_iterations=max_iterations,
            use_memory=use_memory,
            use_web_search=use_web_search,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def get_by_run_id(self, run_id: str) -> Optional[RepairRun]:
        return self.db.query(RepairRun).filter(RepairRun.run_id == run_id).first()

    def update_status(self, run_id: str, status: str):
        self.db.query(RepairRun).filter(RepairRun.run_id == run_id).update({"status": status})
        self.db.commit()

    def update_result(self, run_id: str, fixed_code: Optional[str], passed: bool,
                      confidence_score: float, explanation: Optional[str],
                      iterations: int, status: str, error_type: Optional[str] = None):
        self.db.query(RepairRun).filter(RepairRun.run_id == run_id).update({
            "fixed_code": fixed_code,
            "passed": passed,
            "confidence_score": confidence_score,
            "explanation": explanation,
            "iterations": iterations,
            "status": status,
            "error_type": error_type,
            "completed_at": datetime.utcnow(),
        })
        self.db.commit()

    def list_runs(self, limit: int = 50, offset: int = 0,
                  language: Optional[str] = None,
                  status: Optional[str] = None,
                  passed: Optional[bool] = None) -> List[RepairRun]:
        q = self.db.query(RepairRun)
        if language:
            q = q.filter(RepairRun.language == language)
        if status:
            q = q.filter(RepairRun.status == status)
        if passed is not None:
            q = q.filter(RepairRun.passed == passed)
        return q.order_by(desc(RepairRun.created_at)).limit(limit).offset(offset).all()

    def count_runs(self, language: Optional[str] = None, status: Optional[str] = None) -> int:
        q = self.db.query(func.count(RepairRun.id))
        if language:
            q = q.filter(RepairRun.language == language)
        if status:
            q = q.filter(RepairRun.status == status)
        return q.scalar()

    def get_analytics_summary(self) -> dict:
        total = self.db.query(func.count(RepairRun.id)).scalar()
        successful = self.db.query(func.count(RepairRun.id)).filter(RepairRun.passed == True).scalar()
        failed = total - successful
        avg_conf = self.db.query(func.avg(RepairRun.confidence_score)).scalar() or 0.0
        avg_iter = self.db.query(func.avg(RepairRun.iterations)).scalar() or 0.0
        py_count = self.db.query(func.count(RepairRun.id)).filter(RepairRun.language == "PYTHON").scalar()
        java_count = self.db.query(func.count(RepairRun.id)).filter(RepairRun.language == "JAVA").scalar()
        return {
            "total_repairs": total,
            "successful_repairs": successful,
            "failed_repairs": failed,
            "success_rate": round(successful / total * 100, 1) if total > 0 else 0.0,
            "average_confidence": round(float(avg_conf), 3),
            "average_iterations": round(float(avg_iter), 2),
            "python_repairs": py_count,
            "java_repairs": java_count,
        }

    def get_repair_trends(self, days: int = 30) -> List[dict]:
        start = datetime.utcnow() - timedelta(days=days)
        runs = self.db.query(RepairRun).filter(RepairRun.created_at >= start).all()
        trend_map: dict = {}
        for r in runs:
            day = r.created_at.strftime("%Y-%m-%d")
            if day not in trend_map:
                trend_map[day] = {"date": day, "total": 0, "successful": 0, "failed": 0}
            trend_map[day]["total"] += 1
            if r.passed:
                trend_map[day]["successful"] += 1
            else:
                trend_map[day]["failed"] += 1
        return sorted(trend_map.values(), key=lambda x: x["date"])

    def get_error_distribution(self) -> List[dict]:
        rows = (self.db.query(RepairRun.error_type, func.count(RepairRun.id))
                .filter(RepairRun.error_type.isnot(None))
                .group_by(RepairRun.error_type)
                .all())
        total = sum(r[1] for r in rows)
        return [
            {"error_type": r[0], "count": r[1], "percentage": round(r[1] / total * 100, 1) if total > 0 else 0}
            for r in rows
        ]


class IterationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, run_id: str, iteration_number: int, **kwargs) -> RepairIteration:
        iteration = RepairIteration(run_id=run_id, iteration_number=iteration_number, **kwargs)
        self.db.add(iteration)
        self.db.commit()
        self.db.refresh(iteration)
        return iteration

    def get_by_run_id(self, run_id: str) -> List[RepairIteration]:
        return (self.db.query(RepairIteration)
                .filter(RepairIteration.run_id == run_id)
                .order_by(RepairIteration.iteration_number)
                .all())
