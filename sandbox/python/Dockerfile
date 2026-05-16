FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir pytest pytest-timeout pytest-cov

RUN useradd -m -u 1000 sandbox
WORKDIR /workspace
RUN chown sandbox:sandbox /workspace

USER sandbox

CMD ["python", "-m", "pytest", "--timeout=15", "-v", "--tb=short"]
