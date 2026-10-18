#!/usr/bin/env python3
"""CSP readiness check. Scans index.html, css/ and js/ for network origins and inline code.

Fails (exit 1) if any absolute http(s) URL that is *loaded* (src, href stylesheet, import, fetch,
url()) points off-origin. Documentation links in lesson text are fine and are not loads.
Prints what a CSP would need. Does NOT enforce a CSP: index.html still has inline <script>
blocks, so a strict script-src needs hashes (see docs/CSP.md).
"""
import hashlib, base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text()
fail = []

# inline scripts and their hashes
inline = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)
hashes = ["'sha256-%s'" % base64.b64encode(hashlib.sha256(s.encode()).digest()).decode() for s in inline]

load_patterns = [
    (r'<(?:script|img|iframe|source|video|audio)[^>]+\bsrc="(https?://[^"]+)"', "html src"),
    (r'<link[^>]+href="(https?://[^"]+)"', "html link"),
    (r'url\(\s*["\']?(https?://[^)"\']+)', "css url()"),
    (r'@import\s+["\'](https?://[^"\']+)', "css @import"),
    (r'\bimport\s*(?:\(|[^;]*from\s*)["\'](https?://[^"\']+)', "js import"),
    (r'\bfetch\(\s*["\'`](https?://[^"\'`]+)', "js fetch"),
    (r'new (?:Worker|WebSocket|EventSource)\(\s*["\'`](https?://[^"\'`]+)', "js net"),
]
files = [ROOT / "index.html", ROOT / "404.html"] + sorted((ROOT / "css").glob("*.css")) + sorted((ROOT / "js").rglob("*.js"))
for f in files:
    if not f.exists():
        continue
    t = f.read_text(errors="replace")
    for pat, kind in load_patterns:
        for m in re.finditer(pat, t):
            fail.append(f"{f.relative_to(ROOT)}: off-origin {kind}: {m.group(1)}")

uses_blob = any("blob:" in f.read_text(errors="replace") for f in files if f.exists() and f.suffix == ".js")
uses_wasm = (ROOT / "vendor/pyodide/pyodide.asm.wasm").exists()
print("inline <script> blocks in index.html:", len(inline))
print("Suggested CSP (for review, not enforced):")
print("  default-src 'self'; script-src 'self' 'wasm-unsafe-eval' " + " ".join(hashes) +
      "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self';"
      " connect-src 'self'; worker-src 'self'" + (" blob:" if uses_blob else "") + "; frame-src 'self'; object-src 'none'; base-uri 'self'")
print("  notes: Pyodide needs 'wasm-unsafe-eval'; diagram iframes are same-origin HTML with their own inline script, so they need frame-src 'self' and are not covered by index.html hashes.")
print("  wasm bundled:", uses_wasm, "| blob: used in js:", uses_blob)
for x in fail:
    print("FAIL", x)
print("csp_check:", len(fail), "off-origin loads")
sys.exit(1 if fail else 0)
