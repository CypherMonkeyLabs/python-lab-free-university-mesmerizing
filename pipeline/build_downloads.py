#!/usr/bin/env python3
"""Python Lab v2 download-center build (prototype).
One source (content/<module>/module.md: YAML front matter + Markdown) -> HTML, PDF, DOCX, PPTX,
description sidecars, manifest.json and a static download-center page.
Code fences tagged ```python run are EXECUTED at build time; the captured output is embedded and
labelled with the interpreter that produced it (honesty rule: no invented output).
Deps: markdown, PyYAML, weasyprint (BSD-3), python-docx (MIT), python-pptx (MIT). No network.
Usage: build_downloads.py [--content DIR] [--out DIR]"""
import argparse, html, json, re, subprocess, sys, tempfile, hashlib, datetime, pathlib, platform
import yaml, markdown
from docx import Document
from docx.shared import Pt, RGBColor
from pptx import Presentation
from pptx.util import Inches, Pt as PPt
from pptx.dml.color import RGBColor as PRGB

ROOT = pathlib.Path(__file__).resolve().parent.parent
FENCE = re.compile(r"```python( run)?\n(.*?)```", re.S)
PY = f"CPython {platform.python_version()}"
CSS = """@page{size:A4;margin:18mm 16mm;@bottom-center{content:"CypherMonkeyLabs Python Lab - page " counter(page);font:8pt sans-serif;color:#667}}
body{font:10.5pt/1.5 'DejaVu Sans',sans-serif;color:#1a1d2e}h1{font-size:24pt;color:#4b2a9b;border-bottom:3px solid #f5a623}
h2{color:#4b2a9b;margin-top:1.2em}pre{background:#10142a;color:#e8ecff;padding:8px;border-radius:6px;font-size:9pt;white-space:pre-wrap}
pre.out{background:#e9f7ee;color:#0b3d1d;border-left:4px solid #2bb673}.meta{background:#f3efff;padding:8px;border-radius:6px}
code{font-family:'DejaVu Sans Mono',monospace}footer,.small{font-size:8pt;color:#667}"""

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
    head = (f"<div class='meta'><b>Level {meta['level']}</b> &middot; about {meta['hours']} h &middot; Python {meta['python_min']}+ "
            f"(examples run on {PY}) &middot; Project: {html.escape(meta['project'])}<br><b>You will be able to:</b><ul>{outc}</ul></div>")
    foot = (f"<h2>Sources</h2><ul>{src}</ul><p class='small'>Code &copy; CypherMonkeyLabs, MIT. Text CC BY-NC-SA 4.0. "
            "Educational material, not accredited coursework; no outcome or income promised. Built "
            f"{datetime.date.today()}.</p>")
    return (f"<!doctype html><html lang='en'><meta charset='utf-8'><title>{html.escape(meta['title'])}</title>"
            f"<style>{CSS}</style><body>{head}{''.join(parts)}{foot}</body></html>")

def to_cover(meta, base, out):
    """Cover and outcomes card as PNG (Pillow, HPND licence). Accent colour = the Level's world colour."""
    from PIL import Image, ImageDraw, ImageFont
    fd = "/usr/share/fonts/truetype/dejavu/"
    f = lambda n, z: ImageFont.truetype(fd + n, z)
    acc = meta.get("accent", "#f5a623")
    im = Image.new("RGB", (1280, 720), "#12142b"); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 1280, 26], fill=acc); d.rectangle([0, 694, 1280, 720], fill="#4b2a9b")
    d.text((70, 60), f"LEVEL {int(meta['level']):02d}", font=f("DejaVuSans-Bold.ttf", 120), fill=acc)
    d.text((70, 210), meta["title"], font=f("DejaVuSerif-Bold.ttf", 60), fill="#e8ecff")
    d.text((70, 300), "You will be able to:", font=f("DejaVuSans-Bold.ttf", 26), fill=acc)
    y = 345
    for o in meta["outcomes"]:
        words, line = o.split(), ""
        for w in words:
            if d.textlength(line + " " + w, font=f("DejaVuSans.ttf", 26)) > 1100: d.text((90, y), "- " + line.strip(), font=f("DejaVuSans.ttf", 26), fill="#e8ecff"); y += 36; line = "  " + w
            else: line += " " + w
        d.text((90, y), "- " + line.strip(), font=f("DejaVuSans.ttf", 26), fill="#e8ecff"); y += 44
    d.text((70, 700), f"Python Lab  |  about {meta['hours']} h  |  code MIT, text CC BY-NC-SA 4.0  |  not accredited", font=f("DejaVuSans.ttf", 18), fill="#e8ecff")
    im.save(out, optimize=True)

def to_pdf(h, out):
    from weasyprint import HTML
    HTML(string=h).write_pdf(str(out))

def to_docx(meta, blocks, out):
    d = Document(); d.core_properties.title = meta["title"]; d.core_properties.author = "CypherMonkeyLabs"
    for k, t in blocks:
        if k == "md":
            for line in t.splitlines():
                s = line.rstrip()
                if not s: continue
                if s.startswith("# "): d.add_heading(s[2:], 0)
                elif s.startswith("## "): d.add_heading(s[3:], 1)
                elif s.startswith("- "): d.add_paragraph(strip_md(s[2:]), style="List Bullet")
                elif re.match(r"\d+\. ", s): d.add_paragraph(strip_md(re.sub(r"^\d+\. ", "", s)), style="List Number")
                else: d.add_paragraph(strip_md(s))
        else:
            p = d.add_paragraph(); r = p.add_run(("Output:\n" if k == "out" else "") + t); r.font.name = "Courier New"; r.font.size = Pt(9)
            if k == "out": r.font.color.rgb = RGBColor(0x0b, 0x3d, 0x1d)
    d.add_heading("Sources", 1)
    for s in meta["sources"]: d.add_paragraph(f"{s['title']} - {s['url']}", style="List Bullet")
    d.add_paragraph(f"Examples run on {PY}. Code MIT, text CC BY-NC-SA 4.0. Not accredited coursework.")
    d.save(out)

def strip_md(s): return re.sub(r"[`*]", "", s)

def to_pptx(meta, blocks, out):
    pr = Presentation(); pr.slide_width, pr.slide_height = Inches(13.33), Inches(7.5)
    def slide(title, lines, mono=False, green=False):
        s = pr.slides.add_slide(pr.slide_layouts[6])
        bg = s.background.fill; bg.solid(); bg.fore_color.rgb = PRGB(0x12, 0x14, 0x2b)
        tb = s.shapes.add_textbox(Inches(.6), Inches(.4), Inches(12), Inches(1)).text_frame
        tb.text = title; r = tb.paragraphs[0].runs[0]; r.font.size = PPt(34); r.font.bold = True; r.font.color.rgb = PRGB(0xf5, 0xa6, 0x23)
        bd = s.shapes.add_textbox(Inches(.8), Inches(1.6), Inches(11.8), Inches(5.2)).text_frame; bd.word_wrap = True
        for i, l in enumerate(lines):
            p = bd.paragraphs[0] if i == 0 else bd.add_paragraph(); p.text = l or ' '
            f = p.runs[0].font; f.size = PPt(16 if mono else 22)
            f.name = "Courier New" if mono else "Calibri"
            f.color.rgb = PRGB(0x7d, 0xf2, 0xa6) if green else PRGB(0xe8, 0xec, 0xff)
    slide(meta["title"], [f"Python Lab - Level {meta['level']}", f"About {meta['hours']} hours", "Project: " + meta["project"]])
    slide("You will be able to", meta["outcomes"])
    cur, last_code = meta["title"], None
    for k, t in blocks:
        if k == "md":
            for line in t.splitlines():
                if line.startswith("## "): cur = line[3:]
            bullets = [strip_md(l[2:]) for l in t.splitlines() if l.startswith("- ")]
            nums = [strip_md(l) for l in t.splitlines() if re.match(r"\d+\. ", l)]
            if bullets or nums: slide(cur, bullets or nums)
        elif k == "code": last_code = t
        else:
            slide(cur + " - run it", last_code.splitlines() + ["", f"# Output ({PY}):"] + t.splitlines(), mono=True, green=True)
    slide("Sources", [f"{s['title']}" for s in meta["sources"]] + ["Code MIT, text CC BY-NC-SA 4.0. Not accredited."])
    pr.save(out)

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
    page = f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Download Center - Python Lab</title><style>body{{font:16px/1.5 system-ui;background:#12142b;color:#e8ecff;margin:0;padding:24px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}}.card{{background:#1c2040;border:1px solid #4b2a9b;border-radius:14px;padding:16px;transition:transform .2s}}
.card:hover{{transform:perspective(600px) rotateX(2deg) translateY(-3px)}}a{{color:#f5a623}}li span{{opacity:.7;margin-left:.5em}}
@media (prefers-reduced-motion:reduce){{.card{{transition:none}}.card:hover{{transform:none}}}}</style>
<h1>Download Center</h1><p>Prototype. Every file is built from one Markdown source. Free, no account.</p><div class="grid">{c}</div></html>"""
    out.write_text(page, encoding="utf-8")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--content", default=str(ROOT / "content")); ap.add_argument("--out", default=str(ROOT / "dist/downloads"))
    a = ap.parse_args(); out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    cards, manifest = [], []
    for mp in sorted(pathlib.Path(a.content).glob("*/module.md")):
        meta, body = split(mp); blocks, log = execute(body); base = names(meta)
        h = to_html(meta, blocks)
        (out / f"{base}_Guide.html").write_text(h, encoding="utf-8")
        to_pdf(h, out / f"{base}_Guide.pdf"); to_docx(meta, blocks, out / f"{base}_Worksheet.docx"); to_pptx(meta, blocks, out / f"{base}_Slides.pptx")
        to_cover(meta, base, out / f"{base}_Cover.png")
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

if __name__ == "__main__": main()
