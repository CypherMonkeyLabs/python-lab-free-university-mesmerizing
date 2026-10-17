let boot = null;
let engine = null;
const loaded = new Set();

const HARNESS = `
import ast, io, json, contextlib, traceback

def _lab_run_sync_prelude(source):
    tree = ast.parse(source, filename="<your code>")
    expr = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        expr = tree.body.pop().value
    return tree, expr

async def _lab_exec_check(src, ns):
    lines = src.splitlines() or ["pass"]
    wrapped = "async def __lab_check():\\n" + "\\n".join("    " + line for line in lines)
    exec(compile(wrapped, "<check>", "exec"), ns, ns)
    await ns["__lab_check"]()

async def lab_run(source, checks_json):
    checks = json.loads(checks_json)
    ns = {"__name__": "__main__"}
    buf = io.StringIO()
    try:
        tree, expr = _lab_run_sync_prelude(source)
        with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
            if tree.body:
                exec(compile(tree, "<your code>", "exec"), ns, ns)
            if expr is not None:
                value = eval(compile(ast.Expression(expr), "<your code>", "eval"), ns, ns)
                if value is not None:
                    print(repr(value))
        failures = []
        for index, check in enumerate(checks, 1):
            try:
                with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
                    await _lab_exec_check(check, ns)
            except Exception as exc:
                failures.append("Check %s: %s: %s" % (index, type(exc).__name__, exc))
        return json.dumps({"ok": not failures, "output": buf.getvalue(), "failures": failures})
    except SyntaxError as exc:
        return json.dumps({
            "ok": False,
            "output": "SyntaxError: %s" % exc,
            "failures": ["The code could not be parsed."],
        })
    except Exception:
        return json.dumps({
            "ok": False,
            "output": buf.getvalue() + traceback.format_exc(),
            "failures": ["The code stopped with an exception."],
        })
`;

export async function ensureRuntime(onStatus) {
  if (engine) return engine;
  if (!boot) {
    onStatus?.("Starting the in-browser Python runtime. The first run reads local files and can take a moment.");
    boot = (async () => {
      const pyodideModule = await import("../vendor/pyodide/pyodide.mjs");
      const loadPyodide = pyodideModule.loadPyodide;
      const indexURL = new URL("../vendor/pyodide/", import.meta.url).href;
      const py = await loadPyodide({ indexURL });
      await py.runPythonAsync(HARNESS);
      engine = py;
      return py;
    })().catch((err) => {
      boot = null;
      throw err;
    });
  } else {
    onStatus?.("The Python runtime is still starting.");
  }
  return boot;
}

export async function runStudent({ source, checks = [], packages = [], onStatus }) {
  const py = await ensureRuntime(onStatus);
  const needed = packages.filter((name) => !loaded.has(name));
  if (needed.length) {
    onStatus?.(`Preparing ${needed.join(", ")} from the local runtime files.`);
    await py.loadPackage(needed);
    needed.forEach((name) => loaded.add(name));
  }
  py.globals.set("lab_source", source);
  py.globals.set("lab_checks", JSON.stringify(checks));
  await py.runPythonAsync("_lab_payload = await lab_run(lab_source, lab_checks)");
  const payload = py.globals.get("_lab_payload");
  const text = typeof payload === "string" ? payload : String(payload);
  if (payload && typeof payload.destroy === "function") payload.destroy();
  return JSON.parse(text);
}

export async function pythonVersion() {
  const py = await ensureRuntime();
  const version = py.runPython("import sys; sys.version");
  return String(version);
}
