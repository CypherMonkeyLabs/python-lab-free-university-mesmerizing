#!/usr/bin/env python3
"""CSP check. Fails if a page is missing its meta policy, still has an executable inline
script, or loads a script, image, stylesheet, import, fetch, or worker from another origin.

Documentation links in lesson text are not loads. JSON script blocks (application/json,
application/ld+json) are data, not scripts, and are allowed.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
fail = []

EXECUTABLE = re.compile(
    r"<script(?![^>]*\bsrc=)(?![^>]*\btype\s*=\s*[\"'](?:application/(?:ld\+)?json)[\"'])[^>]*>",
    re.I,
)
CSP_META = re.compile(r'<meta\s+http-equiv="Content-Security-Policy"', re.I)

load_patterns = [
    (r'<(?:script|img|iframe|source|video|audio)[^>]+\bsrc="(https?://[^"]+)"', "html src"),
    (r'<link[^>]+rel=["\']stylesheet["\'][^>]+href="(https?://[^"]+)"', "html stylesheet"),
    (r'<link[^>]+href="(https?://[^"]+)"[^>]+rel=["\']stylesheet["\']', "html stylesheet"),
    (r'url\(\s*["\']?(https?://[^)"\']+)', "css url()"),
    (r'@import\s+["\'](https?://[^"\']+)', "css @import"),
    (r'\bimport\s*(?:\(|[^;]*from\s*)["\'](https?://[^"\']+)', "js import"),
    (r'\bfetch\(\s*["\'`](https?://[^"\'`]+)', "js fetch"),
    (r'new (?:Worker|WebSocket|EventSource)\(\s*["\'`](https?://[^"\'`]+)', "js net"),
]

html_files = sorted(ROOT.rglob("*.html"))
for path in html_files:
    if "node_modules" in path.parts:
        continue
    text = path.read_text(errors="replace")
    rel = path.relative_to(ROOT)
    if not CSP_META.search(text):
        fail.append(f"{rel}: missing Content-Security-Policy meta")
    for match in EXECUTABLE.finditer(text):
        fail.append(f"{rel}: executable inline script: {match.group(0)[:80]}")

files = []
for pattern in ("*.html",):
    files.extend(p for p in ROOT.rglob(pattern) if "node_modules" not in p.parts)
files.extend(sorted((ROOT / "css").glob("*.css")))
files.extend(sorted((ROOT / "js").rglob("*.js")))
for path in files:
    text = path.read_text(errors="replace")
    for pat, kind in load_patterns:
        for match in re.finditer(pat, text):
            fail.append(f"{path.relative_to(ROOT)}: off-origin {kind}: {match.group(1)}")

for item in fail:
    print("FAIL", item)
print("csp_check:", len(fail), "problems")
sys.exit(1 if fail else 0)
