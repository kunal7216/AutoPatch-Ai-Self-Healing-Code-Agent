import uuid
from typing import Optional, List
from datetime import datetime

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

from app.config import settings


class ChromaMemoryService:
    COLLECTION_NAME = "autopatch_fixes"

    def __init__(self):
        self._client = None
        self._collection = None

    def _get_client(self):
        if self._client is None and CHROMA_AVAILABLE:
            try:
                self._client = chromadb.HttpClient(
                    host=settings.chroma_host,
                    port=settings.chroma_port,
                )
            except Exception:
                self._client = None
        return self._client

    def _get_collection(self):
        if self._collection is None:
            client = self._get_client()
            if client:
                try:
                    self._collection = client.get_or_create_collection(
                        name=self.COLLECTION_NAME,
                        metadata={"hnsw:space": "cosine"},
                    )
                except Exception:
                    self._collection = None
        return self._collection

    def store_fix(self, language: str, error_type: str, traceback_summary: str,
                  broken_code_summary: str, fix_summary: str, fixed_code_summary: str,
                  tags: Optional[List[str]] = None) -> Optional[str]:
        collection = self._get_collection()
        if not collection:
            return None

        doc_id = str(uuid.uuid4())
        document = f"""Language: {language}
Error Type: {error_type}
Traceback: {traceback_summary}
Broken Code: {broken_code_summary}
Fix: {fix_summary}"""

        metadata = {
            "language": language,
            "error_type": error_type,
            "traceback_summary": traceback_summary[:500],
            "broken_code_summary": broken_code_summary[:500],
            "fix_summary": fix_summary[:500],
            "fixed_code_summary": fixed_code_summary[:500],
            "tags": ",".join(tags or []),
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            collection.add(documents=[document], metadatas=[metadata], ids=[doc_id])
            return doc_id
        except Exception as e:
            return None

    def search_similar(self, query: str, language: Optional[str] = None,
                       error_type: Optional[str] = None, limit: int = 5) -> List[dict]:
        collection = self._get_collection()
        if not collection:
            return []

        where = {}
        if language:
            where["language"] = language
        if error_type:
            where["error_type"] = error_type

        try:
            kwargs = {"query_texts": [query], "n_results": min(limit, 10)}
            if where:
                kwargs["where"] = where

            results = collection.query(**kwargs)
            records = []
            if results and results.get("ids") and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    meta = results["metadatas"][0][i] if results.get("metadatas") else {}
                    distance = results["distances"][0][i] if results.get("distances") else 1.0
                    similarity = round(1.0 - distance, 4)
                    records.append({
                        "id": doc_id,
                        "language": meta.get("language", ""),
                        "error_type": meta.get("error_type", ""),
                        "traceback_summary": meta.get("traceback_summary", ""),
                        "broken_code_summary": meta.get("broken_code_summary", ""),
                        "fix_summary": meta.get("fix_summary", ""),
                        "fixed_code_summary": meta.get("fixed_code_summary", ""),
                        "tags": meta.get("tags", "").split(",") if meta.get("tags") else [],
                        "similarity_score": similarity,
                        "created_at": meta.get("created_at"),
                    })
            return records
        except Exception:
            return []

    def is_healthy(self) -> bool:
        try:
            client = self._get_client()
            if client:
                client.heartbeat()
                return True
        except Exception:
            pass
        return False
