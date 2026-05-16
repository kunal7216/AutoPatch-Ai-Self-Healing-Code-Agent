import httpx
from typing import List, Optional
from app.config import settings


class SearXNGService:
    def __init__(self):
        self.base_url = settings.searxng_base_url
        self.timeout = 8.0

    def search(self, query: str, num_results: int = 5) -> List[dict]:
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.get(
                    f"{self.base_url}/search",
                    params={"q": query, "format": "json", "language": "en", "categories": "it"},
                )
                resp.raise_for_status()
                data = resp.json()
                results = []
                for item in data.get("results", [])[:num_results]:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", ""),
                    })
                return results
        except Exception:
            return []

    def is_healthy(self) -> bool:
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(f"{self.base_url}/search", params={"q": "test", "format": "json"})
                return resp.status_code == 200
        except Exception:
            return False


class DuckDuckGoService:
    def search(self, query: str, num_results: int = 5) -> List[dict]:
        try:
            from duckduckgo_search import DDGS
            results = []
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=num_results):
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", ""),
                    })
            return results
        except Exception:
            return []


class SearchService:
    def __init__(self):
        self.searxng = SearXNGService()
        self.duckduckgo = DuckDuckGoService()

    def search(self, query: str, num_results: int = 5) -> List[dict]:
        if not settings.enable_web_search:
            return []

        # Try SearXNG first
        results = self.searxng.search(query, num_results)
        if results:
            return results

        # Fallback to DuckDuckGo
        results = self.duckduckgo.search(query, num_results)
        return results

    def format_context(self, results: List[dict]) -> str:
        if not results:
            return ""
        lines = ["Web Search Results:"]
        for i, r in enumerate(results, 1):
            lines.append(f"{i}. {r['title']}")
            if r.get("snippet"):
                lines.append(f"   {r['snippet'][:200]}")
        return "\n".join(lines)
