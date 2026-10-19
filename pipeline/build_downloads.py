#!/usr/bin/env python3
"""Python Lab v2 download-center build (prototype).
One source (content/<module>/module.md: YAML front matter + Markdown) -> HTML, PDF, DOCX, PPTX,
description sidecars, manifest.json and a static download-center page.
Code fences tagged ```python run are EXECUTED at build time; the captured output is embedded and
labelled with the interpreter that produced it (honesty rule: no invented output).
Deps: markdown, PyYAML, weasyprint (BSD-3), python-docx (MIT), python-pptx (MIT). No network.
Usage: build_downloads.py [--content DIR] [--out DIR]"""
import argparse, base64, html, json, re, subprocess, sys, tempfile, hashlib, datetime, pathlib, platform
import yaml, markdown
from docx import Document
from pptx import Presentation
from richdocs import write_docx, write_pptx

ROOT = pathlib.Path(__file__).resolve().parent.parent
FENCE = re.compile(r"```python( run)?\n(.*?)```", re.S)
PY = f"CPython {platform.python_version()}"
CSS = """@page{size:A4;margin:16mm 14mm;@bottom-center{content:"cyphermonkeylabs.com - page " counter(page);font:9pt sans-serif;color:#334}}
body{font:12pt/1.5 'DejaVu Sans',sans-serif;color:#1a1d2e;margin:0}
h1{font-size:26pt;color:#2a1860;margin:0 0 8px}
h2{color:#2a1860;margin-top:1.15em;font-size:16pt}
.banner{background:ACCENT;color:#142018;padding:16px 18px;border-radius:14px;margin:0 0 14px}
pre{background:#1b2140;color:#f4f7ff;padding:12px 14px;border-radius:10px;font-size:11pt;line-height:1.45;white-space:pre-wrap;overflow-x:auto;max-width:100%;box-sizing:border-box}
pre.out{background:#e7f6ec;color:#0c4630;border-left:6px solid #2bb673}
.meta{background:#f7f4ff;padding:12px 14px;border-radius:10px;border:1px solid #d9d0f0}
code{font-family:'DejaVu Sans Mono',monospace}
table{border-collapse:collapse;width:100%;margin:10px 0}
th,td{border:1px solid #c9c3e0;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#efe8ff}
.small{font-size:9pt;color:#445}"""
# Meta CSP for generated HTML. GitHub Pages cannot set response headers.
# These pages have no scripts. The lab shell (index.html) adds wasm-unsafe-eval
# and unsafe-eval because Pyodide's Emscripten glue evaluates wrappers at startup.
CSP = (
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; "
    "font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; "
    "base-uri 'self'; form-action 'self'\">"
)

def split(path):
    t = path.read_text(encoding="utf-8")
    _, fm, body = t.split("---", 2)
    return yaml.safe_load(fm), body.strip()

def run_snippet(code):
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(code); name = f.name
    r = subprocess.run([sys.executable, "-I", name], capture_output=True, text=True, timeout=10)
    return (r.stdout + r.stderr).rstrip(), r.returncode

def execute(body):
    """Return blocks [(kind,text)] kind in md|code|out, and run log."""
    blocks, pos, log = [], 0, []
    for m in FENCE.finditer(body):
        blocks.append(("md", body[pos:m.start()]))
        code = m.group(2)
        blocks.append(("code", code))
        if m.group(1):
            out, rc = run_snippet(code)
            if rc: raise SystemExit(f"snippet failed (rc={rc}):\n{code}\n{out}")
            blocks.append(("out", out)); log.append({"ok": True, "lines": len(out.splitlines())})
        pos = m.end()
    blocks.append(("md", body[pos:]))
    return blocks, log

def names(meta):
    lvl = f"{int(meta['level']):02d}"
    return f"Python-Lab_Level-{lvl}_{meta['slug']}"

def to_html(meta, blocks):
    parts = []
    for k, t in blocks:
        if k == "md": parts.append(markdown.markdown(t, extensions=["extra"]))
        elif k == "code": parts.append(f"<pre><code>{html.escape(t)}</code></pre>")
        else: parts.append(f"<pre class='out'>Output ({PY}):\n{html.escape(t)}</pre>")
    src = "".join(f"<li><a href='{s['url']}'>{html.escape(s['title'])}</a></li>" for s in meta["sources"])
    outc = "".join(f"<li>{html.escape(o)}</li>" for o in meta["outcomes"])
    css = CSS.replace("ACCENT", html.escape(meta.get("accent", "#f5a623"), quote=True))
    head = (f"<div class='banner'><b>Level {meta['level']}</b> &middot; about {meta['hours']} h &middot; Python {meta['python_min']}+</div>"
            f"<div class='meta'><b>Project:</b> {html.escape(meta['project'])}<br>Examples run on {PY}. "
            f"<b>You will be able to:</b><ul>{outc}</ul></div>")
    foot = (f"<h2>Sources</h2><ul>{src}</ul><p class='small'>cyphermonkeylabs.com · Cypher Monkey. Code &copy; CypherMonkeyLabs, MIT. Text CC BY-NC-SA 4.0. "
            "Educational material, not accredited coursework; no outcome or income promised. Built "
            f"{datetime.date.today()}.</p>")
    return (f"<!doctype html><html lang='en'><meta charset='utf-8'>{CSP}<title>{html.escape(meta['title'])}</title>"
            f"<style>{css}</style><body>{head}{''.join(parts)}{foot}</body></html>")

def _hex_rgb(value):
    h = str(value).lstrip("#")
    if len(h) != 6:
        h = "f5a623"
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def to_cover(meta, base, out):
    """Cover and outcomes card as PNG (Pillow, HPND licence). Accent colour = the Level's world colour."""
    from PIL import Image, ImageDraw, ImageFont
    fd = "/usr/share/fonts/truetype/dejavu/"
    font = lambda n, z: ImageFont.truetype(fd + n, z)
    acc = _hex_rgb(meta.get("accent", "#f5a623"))
    deep = _mix(acc, (28, 18, 72), 0.45)
    paper = _mix(acc, (255, 252, 246), 0.82)
    ink = (24, 28, 48)
    im = Image.new("RGB", (1280, 720), paper)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 36, 720], fill=acc)
    d.rectangle([0, 0, 1280, 18], fill=deep)
    d.ellipse([980, -80, 1380, 320], fill=_mix(acc, (255, 255, 255), 0.35))
    d.ellipse([1040, 420, 1320, 760], fill=_mix(acc, (255, 220, 120), 0.45))
    d.rounded_rectangle([70, 48, 360, 130], radius=28, fill=acc)
    d.text((92, 62), f"LEVEL {int(meta['level']):02d}", font=font("DejaVuSans-Bold.ttf", 42), fill=ink)
    d.text((70, 160), meta["title"], font=font("DejaVuSerif-Bold.ttf", 54), fill=ink)
    d.text((70, 250), "You will be able to", font=font("DejaVuSans-Bold.ttf", 28), fill=deep)
    y = 310
    chips = (acc, (255, 196, 61), (94, 196, 160), (255, 122, 166))
    for i, outcome in enumerate(meta["outcomes"][:4]):
        d.ellipse([78, y + 4, 118, y + 44], fill=chips[i % 4])
        d.text((90, y + 8), str(i + 1), font=font("DejaVuSans-Bold.ttf", 22), fill=ink)
        words, line, lines = outcome.split(), "", []
        face = font("DejaVuSans.ttf", 24)
        for w in words:
            trial = (line + " " + w).strip()
            if d.textlength(trial, font=face) > 980 and line:
                lines.append(line)
                line = w
            else:
                line = trial
        if line:
            lines.append(line)
        d.text((136, y + 6), lines[0], font=face, fill=ink)
        y += 52
    d.rectangle([0, 660, 1280, 720], fill=deep)
    d.text((70, 678), f"cyphermonkeylabs.com   ·   about {meta['hours']} h   ·   code MIT, text CC BY-NC-SA 4.0", font=font("DejaVuSans.ttf", 20), fill=(255, 250, 240))
    im.save(out, optimize=True)

def to_pdf(h, out):
    from weasyprint import HTML
    HTML(string=h).write_pdf(str(out))

def strip_md(s): return re.sub(r"[`*]", "", s)

VR = {}
def sidecar(meta, base, files, ok_runs):
    what = meta["outcomes"]
    d = {"title": f"Level {meta['level']}: {meta['title']}", "id": meta["id"], "audience": meta["audience"],
         "hours": meta["hours"], "whats_inside": what, "project": meta["project"],
         "how_to_use": {"pdf": "Read or print; follow the code blocks in your own editor or the in-browser runner.",
                        "docx": "Edit freely for your own notes or classroom.",
                        "pptx": "Present or self-study slide by slide; green slides show verified output.",
                        "html": "Open offline in any browser.",
                        "png": "Cover and outcomes card; use it as a poster or a slide."},
         "python_min": meta["python_min"], "examples_run_on": PY, "snippets_executed": len(ok_runs),
         "level": int(meta["level"]), "base": base, "accent": meta.get("accent", "#f5a623"), "blurb": "; ".join(meta["outcomes"][:2]) + ".", "license": {"code": "MIT", "text": "CC BY-NC-SA 4.0"}, "accredited": False,
         "sources": meta["sources"], "verified": VR, "files": files}
    return d

def verify(out, base):
    """Re-open every generated file with an independent reader; raise on failure."""
    import subprocess as sp
    info = sp.run(["pdfinfo", str(out / f"{base}_Guide.pdf")], capture_output=True, text=True)
    pages = int(re.search(r"Pages:\s+(\d+)", info.stdout).group(1))
    nd = len(Document(str(out / f"{base}_Worksheet.docx")).paragraphs)
    ns = len(Presentation(str(out / f"{base}_Slides.pptx")).slides._sldIdLst)
    assert pages >= 1 and nd > 5 and ns > 3, (pages, nd, ns)
    return {"pdf_pages": pages, "docx_paragraphs": nd, "pptx_slides": ns}

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def human(n): return f"{n/1024:.0f} KB" if n < 1048576 else f"{n/1048576:.1f} MB"

def center_page(cards, out):
    c = "".join(
        f"<article class='card'><h3>{html.escape(x['title'])}</h3><p>{html.escape(x['blurb'])}</p><ul>"
        + "".join(f"<li><a href='{f['name']}' download>{f['format'].upper()}</a> <span>{f['size']}</span></li>" for f in x['files'])
        + f"</ul><details><summary>What's inside</summary><ul>{''.join('<li>'+html.escape(i)+'</li>' for i in x['whats_inside'])}</ul></details>"
        f"<small>About {x['hours']} h &middot; examples run on {html.escape(x['run_on'])} &middot; not accredited</small></article>" for x in cards)
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">{CSP}<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Download Center - Python Lab</title><style>body{{font:16px/1.5 system-ui;background:#f6f3ff;color:#1a1d2e;margin:0;padding:24px}}
h1{{color:#2a1860}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}}.card{{background:#fff;border:1px solid #d9d0f0;border-top:8px solid #7f8cff;border-radius:14px;padding:16px}}
a{{color:#3a2a86;font-weight:700}}li span{{color:#445;margin-left:.5em}}
@media (prefers-reduced-motion:reduce){{.card{{transition:none}}}}</style></head><body>
<h1>Download Center</h1><p>Every file is built from one Markdown source. Free, no account.</p><div class="grid">{c}</div></body></html>"""
    out.write_text(page, encoding="utf-8")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--content", default=str(ROOT / "content")); ap.add_argument("--out", default=str(ROOT / "dist/downloads"))
    ap.add_argument("--pack-b64", action="store_true", help="Write _b64 parts and refresh SHA256SUMS for pdf/docx/pptx/png")
    a = ap.parse_args(); out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    cards, manifest = [], []
    for mp in sorted(pathlib.Path(a.content).glob("*/module.md")):
        meta, body = split(mp); blocks, log = execute(body); base = names(meta)
        h = to_html(meta, blocks)
        (out / f"{base}_Guide.html").write_text(h, encoding="utf-8")
        cover = out / f"{base}_Cover.png"
        to_cover(meta, base, cover)
        to_pdf(h, out / f"{base}_Guide.pdf")
        write_docx(meta, blocks, out / f"{base}_Worksheet.docx", cover, PY)
        write_pptx(meta, blocks, out / f"{base}_Slides.pptx", cover, PY)
        vr = verify(out, base); print('verify', base, vr)
        files = []
        for f in sorted(out.glob(base + "_*")):
            if f.suffix in (".json", ".txt"): continue
            files.append({"name": f.name, "format": f.suffix[1:], "bytes": f.stat().st_size, "size": human(f.stat().st_size), "sha256": sha(f)})
        VR.clear(); VR.update(vr); sc = sidecar(meta, base, files, log)
        (out / f"{base}_description.json").write_text(json.dumps(sc, indent=2), encoding="utf-8")
        (out / f"{base}_description.txt").write_text(f"{sc['title']}\nAudience: {meta['audience']}  Hours: {meta['hours']}\nExamples run on {PY}\n\nInside:\n- " + "\n- ".join(meta['outcomes']) + "\n\nLicense: code MIT, text CC BY-NC-SA 4.0. Not accredited.\n", encoding="utf-8")
        cards.append({"title": sc["title"], "blurb": "; ".join(meta["outcomes"][:2]) + ".", "accent": meta.get("accent", "#f5a623"), "level": int(meta["level"]), "files": files, "whats_inside": meta["outcomes"], "hours": meta["hours"], "run_on": PY})
        manifest.append(sc)
    (out / "manifest.json").write_text(json.dumps({"generated": datetime.datetime.now().isoformat(timespec="seconds"), "modules": manifest}, indent=2))
    center_page(cards, out / "index.html")
    print(f"built {len(manifest)} module(s) -> {out}")
    if a.pack_b64:
        pack_b64(out)


def pack_b64(out, part_chars=100000):
    """Store pdf/docx/pptx/png as joined base64 parts under _b64/, and refresh SHA256SUMS.

    Part names match .github/workflows/restore-binaries.yml: <path>.b64.001, .002, ...
    """
    exts = {".pdf", ".docx", ".pptx", ".png"}
    b64_root = ROOT / "_b64"
    files = sorted(p for p in out.iterdir() if p.suffix.lower() in exts and p.is_file())
    # Drop previous parts for this output directory only.
    rel_out = out.resolve().relative_to(ROOT.resolve())
    old_dir = b64_root / rel_out
    if old_dir.is_dir():
        for stale in old_dir.glob("*.b64.*"):
            stale.unlink()
    written = []
    for src in files:
        raw = base64.b64encode(src.read_bytes()).decode("ascii")
        chunks = [raw[i:i + part_chars] for i in range(0, len(raw), part_chars)] or [""]
        for n, chunk in enumerate(chunks, start=1):
            dest = b64_root / rel_out / f"{src.name}.b64.{n:03d}"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(chunk + "\n", encoding="ascii")
        rel = str(rel_out / src.name)
        written.append((hashlib.sha256(src.read_bytes()).hexdigest(), rel))
        print(f"packed {rel} ({len(chunks)} part(s))")
    sums = ROOT / "SHA256SUMS"
    lines = sums.read_text(encoding="utf-8").splitlines() if sums.exists() else []
    prefix = str(rel_out).replace("\\", "/") + "/"
    kept = [ln for ln in lines if ln.strip() and not ln.split(None, 1)[-1].startswith(prefix)]
    kept.extend(f"{digest}  {rel}" for digest, rel in written)
    sums.write_text("\n".join(kept) + "\n", encoding="utf-8")

if __name__ == "__main__": main()
