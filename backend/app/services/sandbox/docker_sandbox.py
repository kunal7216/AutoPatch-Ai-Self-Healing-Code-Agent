import docker
import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

from app.config import settings
from app.models.enums import Language


@dataclass
class SandboxResult:
    exit_code: int
    stdout: str
    stderr: str
    combined_output: str
    timed_out: bool
    error: Optional[str] = None

    @property
    def passed(self) -> bool:
        return self.exit_code == 0 and not self.timed_out


PYTHON_SANDBOX_IMAGE = "autopatch-python-sandbox:latest"
JAVA_SANDBOX_IMAGE = "autopatch-java-sandbox:latest"

ALLOWED_COMMANDS = {
    Language.PYTHON: ["python", "-m", "pytest", "--timeout=15", "-v", "--tb=short", "/workspace"],
    Language.JAVA: ["mvn", "test", "-q", "-f", "/workspace/pom.xml"],
}

POM_TEMPLATE_PATH = Path(__file__).parent.parent.parent.parent.parent / "sandbox" / "java" / "pom-template.xml"


class DockerSandbox:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception as e:
            self.client = None
            self._init_error = str(e)

    def _get_pom_template(self) -> str:
        fallback = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.autopatch</groupId>
    <artifactId>sandbox</artifactId>
    <version>1.0-SNAPSHOT</version>
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.1.2</version>
            </plugin>
        </plugins>
    </build>
</project>"""
        if POM_TEMPLATE_PATH.exists():
            return POM_TEMPLATE_PATH.read_text()
        return fallback

    def _setup_python_workspace(self, workspace: Path, source_code: str, test_code: str,
                                 dependency_file: Optional[str] = None):
        (workspace / "source.py").write_text(source_code)
        (workspace / "test_source.py").write_text(test_code)
        if dependency_file:
            (workspace / "requirements.txt").write_text(dependency_file)

    def _setup_java_workspace(self, workspace: Path, source_code: str, test_code: str,
                               dependency_file: Optional[str] = None):
        src_main = workspace / "src" / "main" / "java" / "com" / "autopatch"
        src_test = workspace / "src" / "test" / "java" / "com" / "autopatch"
        src_main.mkdir(parents=True, exist_ok=True)
        src_test.mkdir(parents=True, exist_ok=True)

        class_name = self._extract_java_class_name(source_code) or "Solution"
        test_class_name = self._extract_java_class_name(test_code) or "SolutionTest"

        (src_main / f"{class_name}.java").write_text(source_code)
        (src_test / f"{test_class_name}.java").write_text(test_code)
        (workspace / "pom.xml").write_text(self._get_pom_template())

    def _extract_java_class_name(self, code: str) -> Optional[str]:
        import re
        match = re.search(r"public\s+class\s+(\w+)", code)
        return match.group(1) if match else None

    def run_tests(self, language: Language, source_code: str, test_code: str,
                  dependency_file: Optional[str] = None) -> SandboxResult:
        if self.client is None:
            return self._mock_run(source_code, test_code)

        workspace_id = f"autopatch_{uuid.uuid4().hex[:8]}"
        workspace = Path(f"/tmp/autopatch/{workspace_id}")
        workspace.mkdir(parents=True, exist_ok=True)

        container = None
        try:
            if language == Language.PYTHON:
                self._setup_python_workspace(workspace, source_code, test_code, dependency_file)
                image = PYTHON_SANDBOX_IMAGE
                command = ["python", "-m", "pytest", "--timeout=15", "-v", "--tb=short", "/workspace"]
            else:
                self._setup_java_workspace(workspace, source_code, test_code, dependency_file)
                image = JAVA_SANDBOX_IMAGE
                command = ["mvn", "test", "-q"]

            container = self.client.containers.run(
                image=image,
                command=command,
                volumes={str(workspace): {"bind": "/workspace", "mode": "rw"}},
                network_disabled=True,
                mem_limit=settings.sandbox_memory_limit,
                nano_cpus=int(settings.sandbox_cpu_limit * 1e9),
                remove=False,
                detach=True,
                working_dir="/workspace",
                read_only=False,
                security_opt=["no-new-privileges"],
            )

            try:
                result = container.wait(timeout=settings.sandbox_timeout_seconds)
                exit_code = result["StatusCode"]
                logs = container.logs(stdout=True, stderr=True).decode("utf-8", errors="replace")
                stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
                stderr = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")

                return SandboxResult(
                    exit_code=exit_code,
                    stdout=stdout,
                    stderr=stderr,
                    combined_output=logs,
                    timed_out=False,
                )
            except Exception:
                container.kill()
                return SandboxResult(
                    exit_code=1,
                    stdout="",
                    stderr="Execution timed out",
                    combined_output="Execution timed out after limit",
                    timed_out=True,
                )
        except docker.errors.ImageNotFound:
            return SandboxResult(
                exit_code=1,
                stdout="",
                stderr=f"Sandbox image not found. Run: docker compose build",
                combined_output="Sandbox image not available",
                timed_out=False,
                error="Image not found",
            )
        except Exception as e:
            return SandboxResult(
                exit_code=1,
                stdout="",
                stderr=str(e),
                combined_output=str(e),
                timed_out=False,
                error=str(e),
            )
        finally:
            if container:
                try:
                    container.remove(force=True)
                except Exception:
                    pass
            try:
                shutil.rmtree(workspace, ignore_errors=True)
            except Exception:
                pass

    def _mock_run(self, source_code: str, test_code: str) -> SandboxResult:
        """Fallback when Docker is not available - parse code for obvious errors."""
        try:
            compile(source_code, "<source>", "exec")
        except SyntaxError as e:
            return SandboxResult(
                exit_code=1,
                stdout="",
                stderr=f"SyntaxError: {e}",
                combined_output=f"SyntaxError: {e}",
                timed_out=False,
            )
        return SandboxResult(
            exit_code=1,
            stdout="",
            stderr="Docker not available - cannot run tests in sandbox",
            combined_output="MOCK: Docker unavailable",
            timed_out=False,
        )
