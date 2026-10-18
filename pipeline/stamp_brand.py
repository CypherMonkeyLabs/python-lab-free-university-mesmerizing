#!/usr/bin/env python3
"""Stamp the zodiac monkey and cyphermonkeylabs.com onto existing downloads.

Does not rebuild lesson text. HTML, PDF, DOCX, PPTX and PNG covers gain a
brand mark. Re-running skips a file that already carries the domain.
"""

from __future__ import annotations

import base64
import hashlib
import importlib.util
import io
from pathlib import Path

from fpdf import FPDF
from PIL import Image, ImageDraw
from PIL.PngImagePlugin import PngInfo
from pypdf import PdfReader, PdfWriter
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Emu, Pt
from docx import Document
from docx.shared import Inches as DocInches
from docx.shared import Pt as DocPt
from docx.shared import RGBColor as DocRGB

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = ROOT / "downloads"
B64 = ROOT / "_b64"
SHA = ROOT / "SHA256SUMS"
DOMAIN = "cyphermonkeylabs.com"
MARK = "cm-dl-brand"

spec = importlib.util.spec_from_file_location("make_media", ROOT / "scripts" / "make_media.py")
media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media)

SVG = """<svg width="36" height="36" viewBox="0 0 64 64" aria-hidden="true">
<circle cx="32" cy="32" r="30" fill="#1e1442" stroke="#f4b942" stroke-width="2.5"/>
<circle cx="13" cy="31" r="7.5" fill="#8b5a2b"/><circle cx="51" cy="31" r="7.5" fill="#8b5a2b"/>
<ellipse cx="32" cy="32" rx="15" ry="14" fill="#8b5a2b"/>
<ellipse cx="32" cy="36" rx="11" ry="8" fill="#fbd3a7"/>
<circle cx="26.5" cy="29" r="3" fill="#1a1438"/><circle cx="37.5" cy="29" r="3" fill="#1a1438"/>
<path d="M26.5 38.5 Q32 43 37.5 38.5" fill="none" stroke="#5c3317" stroke-width="2"/>
</svg>"""


def monkey_png(size: int = 128) -> Path:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    media.draw_zodiac_monkey(draw, size / 2, size / 2, size * 0.46)
    out = ROOT / "scripts" / ".brand-monkey.png"
    img.save(out)
    return out


def stamp_html(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if MARK in text:
        return False
    block = (
        f"<div class='{MARK}' style='display:flex;gap:10px;align-items:center;margin:0 0 14px'>"
        f"{SVG}<div><b>Cypher Monkey</b><br><span>{DOMAIN}</span></div></div>"
    )
    if "<body>" in text:
        text = text.replace("<body>", "<body>" + block, 1)
    else:
        text = block + text
    if DOMAIN not in text.split(MARK, 1)[-1]:
        text = text.replace("</body>", f"<p class='small'>{DOMAIN}</p></body>", 1)
    path.write_text(text, encoding="utf-8")
    return True


def overlay_bytes(width: float, height: float) -> bytes:
    pdf = FPDF(unit="pt", format=(width, height))
    pdf.add_page()
    pdf.set_auto_page_break(False)
    x, y = 10, 8
    pdf.set_fill_color(30, 20, 66)
    pdf.ellipse(x, y, 14, 14, style="F")
    pdf.set_fill_color(139, 90, 43)
    pdf.ellipse(x - 1, y + 3, 5, 5, style="F")
    pdf.ellipse(x + 10, y + 3, 5, 5, style="F")
    pdf.set_fill_color(251, 211, 167)
    pdf.ellipse(x + 3, y + 5, 8, 6, style="F")
    pdf.set_fill_color(26, 20, 56)
    pdf.ellipse(x + 4, y + 6, 2, 2, style="F")
    pdf.ellipse(x + 8, y + 6, 2, 2, style="F")
    pdf.set_text_color(30, 20, 66)
    pdf.set_font("Helvetica", size=8)
    pdf.text(x + 18, y + 11, DOMAIN)
    return bytes(pdf.output())


def stamp_pdf(path: Path) -> bool:
    reader = PdfReader(str(path))
    sample = ""
    if reader.pages:
        sample = reader.pages[0].extract_text() or ""
    if DOMAIN in sample:
        return False
    writer = PdfWriter()
    for page in reader.pages:
        box = page.mediabox
        stamp = PdfReader(io.BytesIO(overlay_bytes(float(box.width), float(box.height)))).pages[0]
        page.merge_page(stamp)
        writer.add_page(page)
    if reader.metadata:
        writer.add_metadata({k: v for k, v in reader.metadata.items() if isinstance(v, str)})
    with path.open("wb") as handle:
        writer.write(handle)
    return True


def stamp_png(path: Path) -> bool:
    img = Image.open(path).convert("RGBA")
    if img.info.get("cm-brand") == DOMAIN:
        return False
    draw = ImageDraw.Draw(img)
    w, h = img.size
    band_top = h - max(36, int(h * 0.08))
    draw.rectangle([0, band_top, w, h], fill=(28, 18, 72, 255))
    monkey = Image.open(monkey_png(96)).convert("RGBA")
    side = max(28, int(h * 0.07))
    monkey = monkey.resize((side, side))
    img.paste(monkey, (12, band_top + max(2, (h - band_top - side) // 2)), monkey)
    try:
        font = ImageFont_load(max(12, side // 3))
    except Exception:
        font = None
    draw = ImageDraw.Draw(img)
    draw.text((12 + side + 8, band_top + (h - band_top) // 2 - 8), DOMAIN, fill=(255, 235, 180, 255), font=font)
    meta = PngInfo()
    meta.add_text("cm-brand", DOMAIN)
    img.convert("RGB").save(path, optimize=True, pnginfo=meta)
    return True


def ImageFont_load(size: int):
    from PIL import ImageFont
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def stamp_docx(path: Path, picture: Path) -> bool:
    doc = Document(str(path))
    changed = False
    for section in doc.sections:
        footer = section.footer
        footer.is_linked_to_previous = False
        text = "\n".join(p.text for p in footer.paragraphs)
        if DOMAIN in text:
            continue
        paragraph = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
        run = paragraph.add_run(f" {DOMAIN}")
        run.font.size = DocPt(9)
        run.font.color.rgb = DocRGB(0x2A, 0x18, 0x60)
        run.add_picture(str(picture), width=DocInches(0.28))
        changed = True
    if changed:
        doc.save(str(path))
    return changed


def stamp_pptx(path: Path, picture: Path) -> bool:
    prs = Presentation(str(path))
    changed = False
    for slide in prs.slides:
        if any(getattr(shape, "name", "") == "cm-brand" for shape in slide.shapes):
            continue
        width = prs.slide_width
        height = prs.slide_height
        side = int(width * 0.028)
        pic = slide.shapes.add_picture(str(picture), int(width * 0.90), int(height * 0.925), side, side)
        pic.name = "cm-brand"
        box = slide.shapes.add_textbox(int(width * 0.68), int(height * 0.93), int(width * 0.21), int(height * 0.04))
        box.name = "cm-brand-text"
        frame = box.text_frame
        frame.clear()
        run = frame.paragraphs[0].add_run()
        run.text = DOMAIN
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(255, 250, 240)
        run.font.bold = True
        changed = True
    if changed:
        prs.save(str(path))
    return changed


def update_sums(paths: list[Path]) -> None:
    lines = SHA.read_text(encoding="utf-8").splitlines()
    index = {}
    for i, line in enumerate(lines):
        if "  " in line:
            index[line.split("  ", 1)[1]] = i
    for path in paths:
        rel = path.relative_to(ROOT).as_posix()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        row = f"{digest}  {rel}"
        if rel in index:
            lines[index[rel]] = row
        else:
            lines.append(row)
            index[rel] = len(lines) - 1
    SHA.write_text("\n".join(lines) + "\n", encoding="utf-8")


def pack_paths(paths: list[Path]) -> None:
    B64.mkdir(parents=True, exist_ok=True)
    for path in paths:
        rel = path.relative_to(ROOT).as_posix()
        dest_dir = B64 / Path(rel).parent
        dest_dir.mkdir(parents=True, exist_ok=True)
        stem = Path(rel).name
        for old in dest_dir.glob(stem + ".b64.*"):
            old.unlink()
        raw = base64.b64encode(path.read_bytes()).decode("ascii")
        part = 1
        for i in range(0, len(raw), 100000):
            (dest_dir / f"{stem}.b64.{part:03d}").write_text(raw[i:i + 100000] + "\n", encoding="ascii")
            part += 1


def main() -> None:
    picture = monkey_png()
    changed: list[Path] = []
    for path in sorted(DOWNLOADS.rglob("*")):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        did = False
        if suffix in {".html", ".htm"}:
            did = stamp_html(path)
        elif suffix == ".pdf":
            did = stamp_pdf(path)
        elif suffix == ".png":
            did = stamp_png(path)
        elif suffix == ".docx":
            did = stamp_docx(path, picture)
        elif suffix == ".pptx":
            did = stamp_pptx(path, picture)
        if did:
            changed.append(path)
            print("stamped", path.relative_to(ROOT))
    binaries = [p for p in changed if p.suffix.lower() in {".pdf", ".png", ".docx", ".pptx"}]
    extra = []
    for folder, pattern in ((ROOT / "assets", "*.png"), (ROOT / "media", "*")):
        if folder.is_dir():
            extra.extend(p for p in folder.glob(pattern) if p.is_file() and p.suffix.lower() in {".png", ".mp3", ".webm", ".mp4", ".gif", ".jpg"})
    update_sums(binaries + extra)
    pack_paths(binaries + [p for p in extra if p.suffix.lower() in {".mp3", ".png", ".webm", ".mp4", ".gif"}])
    print(f"stamped {len(changed)} files")


if __name__ == "__main__":
    main()
