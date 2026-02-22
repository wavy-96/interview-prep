"""
Epic 6.1: Modal sandbox for safe code execution.
Deploy: modal deploy execute.py
Set MODAL_EXECUTE_URL in .env.local to the deployed endpoint URL.
"""

import time

import modal

# Multi-language image: Python 3.12, Node 22, Java 21
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("openjdk-21-jdk")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
        "apt-get install -y nodejs",
    )
)

app = modal.App("interview-prep-execute", image=image)

# Output cap 64KB per stream
MAX_OUTPUT = 64 * 1024


def truncate(s: str, max_len: int = MAX_OUTPUT) -> str:
    if len(s) <= max_len:
        return s
    return s[:max_len] + "\n...[truncated]"


def run_in_sandbox(sb: "modal.Sandbox", cmd: list[str], timeout: int) -> dict:
    """Run command in sandbox, return result dict."""
    try:
        start = time.perf_counter()
        proc = sb.exec(cmd[0], *cmd[1:], timeout=timeout)
        stdout = proc.stdout.read()
        stderr = proc.stderr.read()
        proc.wait()
        duration_ms = int((time.perf_counter() - start) * 1000)
        return {
            "stdout": truncate(stdout),
            "stderr": truncate(stderr),
            "exitCode": proc.returncode if proc.returncode is not None else 0,
            "duration_ms": duration_ms,
        }
    except Exception as e:
        err_msg = str(e)
        if "timeout" in err_msg.lower() or "timed out" in err_msg.lower():
            return {"error": "Execution timed out"}
        return {"error": err_msg[:500]}


def write_to_sandbox(sb: "modal.Sandbox", path: str, code: str) -> bool:
    """Write code to path in sandbox via base64. Returns True on success."""
    import base64
    encoded = base64.b64encode(code.encode()).decode()
    proc = sb.exec("bash", "-c", f"echo {encoded} | base64 -d > {path}", timeout=5)
    proc.wait()
    return proc.returncode == 0


def run_tests_python(sb: "modal.Sandbox", code: str, fn_name: str, tests: list, timeout: int) -> dict:
    """Run Python code against test cases."""
    import json
    tests_json = json.dumps(tests)
    tests_escaped = json.dumps(tests_json)  # for embedding in Python string
    harness = f'''import json
{code}

_fn = globals().get("{fn_name}")
if _fn is None:
    print(json.dumps([{{"error": "Function {fn_name} not found"}}]))
else:
    def _compare(a, e):
        if a == e: return True
        if isinstance(a, float) and isinstance(e, (int, float)):
            return abs(a - float(e)) < 1e-9
        if isinstance(a, (list, dict)) and isinstance(e, (list, dict)):
            return json.dumps(a, sort_keys=True) == json.dumps(e, sort_keys=True)
        return str(a).strip() == str(e).strip()

    _tests = json.loads({tests_escaped})
    _results = []
    for i, t in enumerate(_tests):
        try:
            inp = t.get("input", {{}})
            expected = t.get("expected_output")
            result = _fn(**inp)
            passed = _compare(result, expected)
            _results.append({{"index": i, "passed": passed, "input": inp, "expected": expected, "actual": result}})
        except Exception as ex:
            _results.append({{"index": i, "passed": False, "input": inp, "expected": expected, "actual": None, "error": str(ex)}})
    print(json.dumps(_results))
'''
    if not write_to_sandbox(sb, "/tmp/harness.py", harness):
        return {"error": "Failed to write test harness"}
    return run_in_sandbox(sb, ["python", "/tmp/harness.py"], timeout)


@app.function(
    timeout=15,
    memory=512,
    cpu=1,
)
@modal.fastapi_endpoint(method="POST")
def execute(payload: dict):
    """Run user code in a sandbox. POST { code, language, test_cases?, function_name? }."""
    import json
    code = payload.get("code") or ""
    language = (payload.get("language") or "python").lower()
    timeout_sec = min(int(payload.get("timeout", 5)), 10)
    test_cases = payload.get("test_cases") or []
    function_name = payload.get("function_name")

    if not code.strip():
        return {"error": "Empty code"}

    # Test case mode
    if test_cases and function_name and language == "python":
        sb = modal.Sandbox.create(app=app, image=image, block_network=True, timeout=60)
        try:
            result = run_tests_python(sb, code, function_name, test_cases, timeout_sec)
            sb.terminate()
            if "error" in result:
                return result
            try:
                results = json.loads(result.get("stdout", "[]"))
                if isinstance(results, dict) and "error" in results:
                    return {"error": results["error"]}
                passed = sum(1 for r in results if r.get("passed")) if isinstance(results, list) else 0
                return {
                    "stdout": result.get("stdout", ""),
                    "stderr": result.get("stderr", ""),
                    "exitCode": result.get("exitCode", 0),
                    "duration_ms": result.get("duration_ms", 0),
                    "testResults": results,
                    "passed": passed,
                    "total": len(results) if isinstance(results, list) else 0,
                }
            except json.JSONDecodeError:
                return result
        finally:
            try:
                sb.terminate()
            except Exception:
                pass

    # Create sandbox with network blocked
    sb = modal.Sandbox.create(
        app=app,
        image=image,
        block_network=True,
        timeout=60,
    )

    try:
        if language == "python":
            if not write_to_sandbox(sb, "/tmp/main.py", code):
                return {"error": "Failed to write code to sandbox"}
            return run_in_sandbox(sb, ["python", "/tmp/main.py"], timeout_sec)

        if language in ("javascript", "js", "node"):
            if not write_to_sandbox(sb, "/tmp/main.js", code):
                return {"error": "Failed to write code to sandbox"}
            return run_in_sandbox(sb, ["node", "/tmp/main.js"], timeout_sec)

        if language == "java":
            class_name = "Main"
            for line in code.splitlines():
                line = line.strip()
                if line.startswith("public class "):
                    parts = line.split()
                    if len(parts) >= 3:
                        class_name = parts[2].rstrip("{")
                    break
            if not write_to_sandbox(sb, f"/tmp/{class_name}.java", code):
                return {"error": "Failed to write code to sandbox"}
            compile_proc = sb.exec("javac", f"/tmp/{class_name}.java", timeout=min(timeout_sec, 10))
            compile_proc.wait()
            if compile_proc.returncode != 0:
                stderr = compile_proc.stderr.read()
                return {
                    "stdout": "",
                    "stderr": truncate(stderr),
                    "exitCode": compile_proc.returncode or 1,
                    "duration_ms": 0,
                }
            return run_in_sandbox(sb, ["java", "-cp", "/tmp", class_name], timeout_sec)

        return {"error": f"Unsupported language: {language}"}
    finally:
        sb.terminate()
