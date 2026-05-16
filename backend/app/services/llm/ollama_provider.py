import httpx
from typing import Optional
from app.config import settings


class OllamaProvider:
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        self.timeout = 120.0

    def generate(self, prompt: str, system_prompt: Optional[str] = None,
                 temperature: float = 0.1, max_tokens: int = 2048) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(f"{self.base_url}/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["message"]["content"]
        except httpx.ConnectError:
            return self._fallback_fix(prompt)
        except Exception as e:
            return f"LLM Error: {str(e)}"

    def is_healthy(self) -> bool:
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    def _fallback_fix(self, prompt: str) -> str:
        """Minimal fallback when Ollama is unavailable."""
        return """# Ollama is not available. Please ensure Ollama is running.
# Run: docker compose up ollama
# Then: docker exec -it autopatch-ollama ollama pull qwen2.5-coder:7b

# The original code is returned unchanged.
pass
"""

    def generate_fix(self, language: str, broken_code: str, test_code: str,
                     error_type: str, traceback: str, context: str = "") -> str:
        system = f"""You are an expert {language} code repair agent.
Your task is to fix broken {language} code so that the provided tests pass.

Rules:
1. Return ONLY the fixed source code, no explanations, no markdown, no code fences.
2. Preserve all public function names, class names, and method signatures.
3. Do NOT modify the test code.
4. Make minimal changes to fix the issue.
5. The fixed code must be syntactically valid {language}.
"""
        user = f"""Language: {language}
Error Type: {error_type}

Test Output / Traceback:
{traceback[:2000]}

{f'Relevant Context:{chr(10)}{context[:1000]}' if context else ''}

Broken Source Code:
{broken_code}

Test Code (DO NOT MODIFY):
{test_code}

Return ONLY the fixed source code:"""

        return self.generate(user, system_prompt=system, temperature=0.05)

    def analyze_error(self, language: str, test_output: str, source_code: str) -> str:
        system = "You are a code debugging expert. Analyze test failures concisely."
        user = f"""Language: {language}
Test Output:
{test_output[:2000]}

Source Code:
{source_code[:1000]}

Provide a brief analysis (3-5 sentences):
1. What is the root cause?
2. Which line/function is failing?
3. What needs to be fixed?"""
        return self.generate(user, system_prompt=system, temperature=0.1, max_tokens=512)

    def generate_explanation(self, language: str, broken_code: str, fixed_code: str,
                              error_type: str) -> str:
        system = "You are a code mentor. Explain code fixes clearly and concisely."
        user = f"""Language: {language}
Error Type: {error_type}

Original Broken Code:
{broken_code[:800]}

Fixed Code:
{fixed_code[:800]}

Explain in 3-4 sentences: what was the bug and how was it fixed?"""
        return self.generate(user, system_prompt=system, temperature=0.2, max_tokens=256)
