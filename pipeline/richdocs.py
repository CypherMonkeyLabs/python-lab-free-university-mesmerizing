"""Visually rich PPTX decks and styled DOCX worksheets for the download pipeline.

Shapes, colours, and cover art are drawn here (python-pptx, python-docx, Pillow).
No third-party images. Code text is the module source; output text is what the
build interpreter printed.
"""
import pathlib
import textwrap

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor, Twips
from pptx import Presentation
from pptx.dml.color import RGBColor as PRGB
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches as PInches, Pt as PPt

SLIDE_W = 13.333
SLIDE_H = 7.5


def rgb_of(value):
    h = str(value).lstrip("#")
    if len(h) != 6:
        h = "f5a623"
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def prgb(c):
    return PRGB(c[0], c[1], c[2])


def drgb(c):
    return RGBColor(c[0], c[1], c[2])


def wrap_lines(text, width):
    out = []
    for raw in text.replace("\t", "    ").splitlines() or [""]:
        if raw.strip() == "":
            out.append("")
            continue
        bits = textwrap.wrap(raw, width=width, replace_whitespace=False, drop_whitespace=False) or [raw]
        out.extend(bits)
    return out


def chunked(lines, size):
    if not lines:
        return [[""]]
    return [lines[i:i + size] for i in range(0, len(lines), size)]


# ---------- PPTX ----------

def _box(slide, x, y, w, h, fill, line=None, rounded=False, radius=0.15):
    kind = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(kind, PInches(x), PInches(y), PInches(w), PInches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = prgb(fill)
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = prgb(line)
        shape.line.width = PPt(1.5)
    if rounded:
        try:
            shape.adjustments[0] = radius
        except (IndexError, AttributeError):
            pass
    tf = shape.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.margin_left = PInches(0.14)
    tf.margin_right = PInches(0.14)
    tf.margin_top = PInches(0.08)
    tf.margin_bottom = PInches(0.08)
    tf.paragraphs[0].alignment = PP_ALIGN.LEFT
    tf._txBody.bodyPr.set("anchor", "t")
    return shape


def _text(shape, lines, size, color, bold=False, font="Calibri", align="left", spacing=4):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    align_enum = PP_ALIGN.CENTER if align == "center" else PP_ALIGN.LEFT
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align_enum
        p.space_after = PPt(spacing)
        p.space_before = PPt(0)
        run = p.add_run()
        run.text = line if line != "" else " "
        run.font.size = PPt(size)
        run.font.bold = bold
        run.font.color.rgb = prgb(color)
        run.font.name = font
    return shape


def _chrome(slide, theme, kicker):
    _box(slide, 0, 0, SLIDE_W, SLIDE_H, theme["bg"])
    _box(slide, 0, 0, 0.18, SLIDE_H, theme["accent"])
    _box(slide, 0, 0, SLIDE_W, 0.12, theme["accent_deep"])
    bar = _box(slide, 0, 7.08, SLIDE_W, 0.42, theme["accent_deep"])
    _text(bar, [kicker], 13, theme["on_deep"], bold=True, align="left")
    # three small diamonds so the footer band is not a flat empty strip
    for i, col in enumerate((theme["accent"], theme["gold"], theme["mint"])):
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, PInches(12.15 + i * 0.28), PInches(7.2), PInches(0.18), PInches(0.18))
        dot.fill.solid()
        dot.fill.fore_color.rgb = prgb(col)
        dot.line.fill.background()


def _theme(meta):
    accent = rgb_of(meta.get("accent", "#f5a623"))
    deep = mix(accent, (18, 16, 48), 0.55)
    return {
        "accent": accent,
        "accent_deep": deep,
        "bg": mix(accent, (255, 252, 246), 0.9),
        "card": (255, 255, 255),
        "ink": (24, 28, 48),
        "muted": (70, 74, 98),
        "on_deep": (255, 250, 240),
        "code_bg": (22, 27, 58),
        "code_fg": (236, 242, 255),
        "out_bg": (226, 247, 232),
        "out_fg": (12, 70, 36),
        "gold": (255, 196, 61),
        "mint": (94, 234, 180),
        "pink": (255, 122, 166),
    }


def _kicker(meta, page, pages):
    return f"Python Lab   ·   Level {int(meta['level']):02d}   ·   {meta['title']}   ·   {page} / {pages}"


def _md_pieces(blocks):
    """Turn executed markdown/code/output blocks into slide specs."""
    title = None
    prose, bullets, nums = [], [], []
    specs = []

    def flush():
        nonlocal prose, bullets, nums
        if prose or bullets or nums:
            specs.append({"kind": "text", "title": title or "Notes", "prose": prose[:4], "bullets": bullets[:6], "nums": nums[:6]})
        prose, bullets, nums = [], [], []

    pending = None
    for kind, text in blocks:
        if kind == "md":
            for line in text.splitlines():
                s = line.rstrip()
                if s.startswith("# "):
                    continue
                if s.startswith("## "):
                    flush()
                    title = s[3:].strip()
                    continue
                if s.startswith("- "):
                    bullets.append(_strip(s[2:]))
                    continue
                if s[:3].rstrip(".").isdigit() and ". " in s[:4]:
                    nums.append(_strip(s.split(". ", 1)[1]))
                    continue
                plain = _strip(s)
                if plain:
                    prose.append(plain)
        elif kind == "code":
            flush()
            pending = text.rstrip("\n")
        else:
            specs.append({"kind": "code", "title": title or "Run it", "code": pending or "", "out": text.rstrip("\n")})
            pending = None
    if pending:
        specs.append({"kind": "code", "title": title or "Code", "code": pending, "out": ""})
    flush()
    return specs


def _strip(s):
    return s.replace("`", "").replace("**", "").replace("*", "").strip()


def write_pptx(meta, blocks, out, cover, interpreter):
    theme = _theme(meta)
    pr = Presentation()
    pr.slide_width = PInches(SLIDE_W)
    pr.slide_height = PInches(SLIDE_H)
    pr.core_properties.title = meta["title"]
    pr.core_properties.author = "CypherMonkeyLabs"
    pr.core_properties.subject = f"Python Lab Level {meta['level']}"
    specs = _md_pieces(blocks)
    # title + outcomes + content + sources
    planned = 2 + len(specs) + 1
    page = 0

    def new():
        nonlocal page
        page += 1
        slide = pr.slides.add_slide(pr.slide_layouts[6])
        _chrome(slide, theme, _kicker(meta, page, planned))
        return slide

    # Title
    s = new()
    pill = _box(s, 0.45, 0.4, 2.3, 0.48, theme["accent"], rounded=True, radius=0.5)
    _text(pill, [f"LEVEL {int(meta['level']):02d}"], 20, theme["ink"], bold=True, align="center")
    title = _box(s, 0.4, 1.05, 7.7, 1.5, theme["bg"])
    _text(title, wrap_lines(meta["title"], 22)[:2], 40, theme["ink"], bold=True)
    sub = _box(s, 0.45, 2.6, 7.6, 1.15, theme["card"], line=theme["accent"], rounded=True)
    _text(sub, [
        f"About {meta['hours']} hours  ·  Python {meta['python_min']}+",
        "Project: " + meta["project"],
        f"Examples run on {interpreter}",
    ], 18, theme["ink"])
    # outcome chips
    cols = [theme["accent"], theme["gold"], theme["mint"], theme["pink"]]
    for i, outcome in enumerate(meta["outcomes"][:4]):
        y = 3.95 + (i % 4) * 0.72
        chip = _box(s, 0.45, y, 7.6, 0.64, theme["card"], line=cols[i % 4], rounded=True)
        badge = _box(s, 0.58, y + 0.12, 0.4, 0.4, cols[i % 4], rounded=True, radius=0.5)
        _text(badge, [str(i + 1)], 16, theme["ink"], bold=True, align="center")
        body = _box(s, 1.1, y + 0.04, 6.8, 0.56, theme["card"])
        _text(body, wrap_lines(outcome, 48)[:1], 16, theme["ink"], bold=True)
    if cover and pathlib.Path(cover).is_file():
        frame = _box(s, 8.35, 0.45, 4.6, 3.15, theme["card"], line=theme["accent"], rounded=True)
        s.shapes.add_picture(str(cover), PInches(8.5), PInches(0.7), PInches(4.3), PInches(2.42))
        cap = _box(s, 8.5, 3.15, 4.3, 0.35, theme["accent"])
        _text(cap, ["Cover card for this Level"], 13, theme["ink"], bold=True, align="center")
    else:
        art = _box(s, 8.35, 0.45, 4.6, 3.15, theme["accent_deep"], rounded=True)
        _text(art, ["Python", "Lab"], 48, theme["gold"], bold=True, align="center")
    note = _box(s, 8.35, 3.8, 4.6, 2.95, mix(theme["accent"], (255, 255, 255), 0.75), line=theme["accent_deep"], rounded=True)
    _text(note, [
        "How to use these slides",
        "Read a slide, then try the code",
        "in your editor or the lab runner.",
        "Green panels are real output.",
        "Not accredited coursework.",
    ], 16, theme["ink"])

    # Outcomes as a full diagram
    s = new()
    h = _box(s, 0.4, 0.28, 12.5, 0.7, theme["bg"])
    _text(h, ["You will be able to"], 32, theme["ink"], bold=True)
    n = max(1, min(4, len(meta["outcomes"])))
    gap = 0.18
    top = 1.15
    height = (5.75 - gap * (n - 1)) / n
    for i, outcome in enumerate(meta["outcomes"][:4]):
        y = top + i * (height + gap)
        card = _box(s, 0.45, y, 12.4, height, theme["card"], line=cols[i % 4], rounded=True)
        circ = slide_oval(s, 0.7, y + height / 2 - 0.28, 0.56, cols[i % 4])
        _text(circ, [str(i + 1)], 22, theme["ink"], bold=True, align="center")
        # arrow toward the next idea
        if i < n - 1:
            arr = s.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, PInches(12.35), PInches(y + height - 0.05), PInches(0.28), PInches(0.28))
            arr.fill.solid()
            arr.fill.fore_color.rgb = prgb(theme["accent_deep"])
            arr.line.fill.background()
        words = _box(s, 1.45, y + 0.08, 10.6, height - 0.16, theme["card"])
        size = 26 if len(outcome) < 70 else 20
        _text(words, wrap_lines(outcome, 42)[:3], size, theme["ink"], bold=True)

    for spec in specs:
        if spec["kind"] == "text":
            _text_slide(new(), theme, spec, cols)
        else:
            _code_slides(new, theme, spec, interpreter)
    _sources_slide(new(), theme, meta)
    # fix page numbers now that the count is known
    total = len(pr.slides)
    for i, slide in enumerate(pr.slides, start=1):
        # footer is the wide bar; its text frame is the last full-width shape we can find by position
        for shape in slide.shapes:
            if shape.top > PInches(7.0) and shape.width > PInches(10):
                _text(shape, [_kicker(meta, i, total)], 13, theme["on_deep"], bold=True)
                break
    pr.save(out)


def slide_oval(slide, x, y, d, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, PInches(x), PInches(y), PInches(d), PInches(d))
    shape.fill.solid()
    shape.fill.fore_color.rgb = prgb(fill)
    shape.line.fill.background()
    tf = shape.text_frame
    tf.word_wrap = False
    tf._txBody.bodyPr.set("anchor", "ctr")
    return shape


def _text_slide(slide, theme, spec, cols):
    h = _box(slide, 0.4, 0.28, 12.5, 0.78, theme["bg"])
    _text(h, wrap_lines(spec["title"], 36)[:2], 32, theme["ink"], bold=True)
    items = spec["bullets"] or spec["nums"] or spec["prose"]
    if not items:
        items = ["See the guide for the full wording."]
    n = min(5, len(items))
    gap = 0.14
    top = 1.2
    height = (5.7 - gap * (n - 1)) / n
    numbered = bool(spec["nums"]) and not spec["bullets"]
    for i, item in enumerate(items[:n]):
        y = top + i * (height + gap)
        card = _box(slide, 0.45, y, 12.4, height, theme["card"], line=cols[i % 4], rounded=True)
        mark = str(i + 1) if numbered else "▸"
        badge = slide_oval(slide, 0.68, y + max(0.08, height / 2 - 0.26), 0.5, cols[i % 4])
        _text(badge, [mark], 18, theme["ink"], bold=True, align="center")
        body = _box(slide, 1.4, y + 0.06, 11.2, max(0.4, height - 0.12), theme["card"])
        size = 24 if len(item) < 80 else 18
        _text(body, wrap_lines(item, 52)[:3], size, theme["ink"])
    # side rail icons so the right edge of a short card still has colour
    rail = _box(slide, 12.55, 1.2, 0.28, 5.7, theme["accent"], rounded=True, radius=0.4)


def _code_slides(new, theme, spec, interpreter):
    code_lines = wrap_lines(spec["code"], 46)
    out_lines = wrap_lines(spec["out"], 32) if spec["out"] else []
    parts = chunked(code_lines, 12)
    for i, part in enumerate(parts):
        slide = new()
        title = spec["title"] + ("" if len(parts) == 1 else f"  ({i + 1}/{len(parts)})")
        h = _box(slide, 0.4, 0.26, 12.5, 0.62, theme["bg"])
        _text(h, [title], 28, theme["ink"], bold=True)
        show_out = bool(out_lines) and i == len(parts) - 1
        code_w = 7.55 if show_out else 12.4
        panel = _box(slide, 0.4, 1.05, code_w, 5.85, theme["code_bg"], rounded=True, radius=0.08)
        header = _box(slide, 0.4, 1.05, code_w, 0.42, mix(theme["accent"], theme["code_bg"], 0.35))
        _text(header, ["Python"], 16, theme["gold"], bold=True, font="Calibri")
        body = _box(slide, 0.5, 1.52, code_w - 0.2, 5.25, theme["code_bg"])
        _text(body, part, 18, theme["code_fg"], font="Consolas", spacing=2)
        if show_out:
            op = _box(slide, 8.15, 1.05, 4.75, 5.85, theme["out_bg"], line=theme["out_fg"], rounded=True, radius=0.08)
            oh = _box(slide, 8.15, 1.05, 4.75, 0.42, mix((46, 160, 90), (255, 255, 255), 0.2))
            _text(oh, ["Output"], 16, theme["out_fg"], bold=True)
            ob = _box(slide, 8.25, 1.55, 4.55, 4.4, theme["out_bg"])
            shown = out_lines[:12]
            _text(ob, shown, 16, theme["out_fg"], font="Consolas", spacing=2)
            cap = _box(slide, 8.25, 6.15, 4.55, 0.6, theme["out_bg"])
            _text(cap, wrap_lines(f"Printed by {interpreter}. Not invented.", 28)[:2], 12, theme["out_fg"])
        else:
            cap = _box(slide, 0.55, 6.35, code_w - 0.3, 0.42, theme["code_bg"])
            _text(cap, ["Code from this Level's guide. Run it yourself to see the output."], 13, theme["gold"])


def _sources_slide(slide, theme, meta):
    h = _box(slide, 0.4, 0.28, 12.5, 0.7, theme["bg"])
    _text(h, ["Sources and licence"], 32, theme["ink"], bold=True)
    sources = list(meta["sources"])[:5]
    n = max(1, len(sources))
    gap = 0.12
    top = 1.15
    height = min(0.85, (4.3 - gap * (n - 1)) / n)
    for i, src in enumerate(sources):
        y = top + i * (height + gap)
        card = _box(slide, 0.45, y, 12.4, height, theme["card"], line=theme["accent"], rounded=True)
        _text(card, [src["title"], src["url"]], 16, theme["ink"], bold=False)
    foot = _box(slide, 0.45, 5.55, 12.4, 1.35, mix(theme["accent"], (255, 255, 255), 0.72), line=theme["accent_deep"], rounded=True)
    _text(foot, [
        "Code © CypherMonkeyLabs, MIT.  Text CC BY-NC-SA 4.0.",
        "Educational material, not accredited coursework. No outcome is promised.",
        "Python is a trademark of the Python Software Foundation.",
    ], 16, theme["ink"])


# ---------- DOCX ----------

def _shade(cell, hex_color):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc_pr.append(shd)


def _set_run_font(run, name, size, color, bold=False):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.color.rgb = drgb(color)
    run.bold = bold
    r_pr = run._element.get_or_add_rPr()
    r_fonts = r_pr.find(qn("w:rFonts"))
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        r_pr.append(r_fonts)
    r_fonts.set(qn("w:ascii"), name)
    r_fonts.set(qn("w:hAnsi"), name)
    r_fonts.set(qn("w:cs"), name)


def _cell_text(cell, text, size, color, bold=False, fill=None, font="Calibri"):
    if fill:
        _shade(cell, fill)
    cell.text = ""
    p = cell.paragraphs[0]
    run = p.add_run(text)
    _set_run_font(run, font, size, color, bold)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)


def _set_table_widths(table, widths):
    table.autofit = False
    tbl = table._tbl
    tbl_pr = tbl.tblPr if tbl.tblPr is not None else OxmlElement("w:tblPr")
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    total = sum(widths)
    tbl_w.set(qn("w:w"), str(int(total)))
    tbl_w.set(qn("w:type"), "dxa")
    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        for child in list(grid):
            grid.remove(child)
    else:
        grid = OxmlElement("w:tblGrid")
        tbl_pr.addnext(grid)
    for w in widths:
        gc = OxmlElement("w:gridCol")
        gc.set(qn("w:w"), str(int(w)))
        grid.append(gc)
    for row in table.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = Twips(w)
            tc = cell._tc
            tc_pr = tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(int(w)))
            tc_w.set(qn("w:type"), "dxa")


def write_docx(meta, blocks, out, cover, interpreter):
    accent = rgb_of(meta.get("accent", "#f5a623"))
    deep = mix(accent, (18, 16, 48), 0.45)
    ink = (24, 28, 48)
    d = Document()
    d.core_properties.title = meta["title"]
    d.core_properties.author = "CypherMonkeyLabs"
    d.core_properties.subject = f"Python Lab Level {meta['level']} worksheet"
    normal = d.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(12)
    normal.font.color.rgb = drgb(ink)
    section = d.sections[0]
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)
    content_dxa = 10080  # about 7 inches

    if cover and pathlib.Path(cover).is_file():
        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(cover), width=Inches(6.6))

    h = d.add_heading(meta["title"], 0)
    for run in h.runs:
        _set_run_font(run, "Calibri", 26, deep, True)
    intro = d.add_paragraph()
    r = intro.add_run(
        f"Level {int(meta['level']):02d}  ·  about {meta['hours']} hours  ·  Python {meta['python_min']}+  ·  "
        f"examples run on {interpreter}"
    )
    _set_run_font(r, "Calibri", 12, deep, True)
    proj = d.add_paragraph()
    r = proj.add_run("Project: " + meta["project"])
    _set_run_font(r, "Calibri", 14, ink, True)

    d.add_heading("You will be able to", 1)
    for run in d.paragraphs[-1].runs:
        _set_run_font(run, "Calibri", 18, deep, True)
    table = d.add_table(rows=1 + len(meta["outcomes"]), cols=2)
    table.style = "Table Grid"
    _cell_text(table.rows[0].cells[0], "Outcome", 12, (255, 255, 255), True, fill=_hex(deep))
    _cell_text(table.rows[0].cells[1], "My notes", 12, (255, 255, 255), True, fill=_hex(deep))
    for i, outcome in enumerate(meta["outcomes"], start=1):
        fill = "F7F4FF" if i % 2 else "FFFFFF"
        _cell_text(table.rows[i].cells[0], outcome, 12, ink, fill=fill)
        _cell_text(table.rows[i].cells[1], "", 12, ink, fill=fill)
    _set_table_widths(table, [6800, 3280])
    d.add_paragraph()

    for kind, text in blocks:
        if kind == "md":
            for line in text.splitlines():
                s = line.rstrip()
                if not s:
                    continue
                if s.startswith("# "):
                    p = d.add_heading(_strip(s[2:]), 0)
                    for run in p.runs:
                        _set_run_font(run, "Calibri", 26, deep, True)
                elif s.startswith("## "):
                    p = d.add_heading(_strip(s[3:]), 1)
                    for run in p.runs:
                        _set_run_font(run, "Calibri", 18, deep, True)
                elif s.startswith("- "):
                    p = d.add_paragraph(_strip(s[2:]), style="List Bullet")
                    for run in p.runs:
                        _set_run_font(run, "Calibri", 12, ink)
                elif len(s) > 2 and s[0].isdigit() and ". " in s[:4]:
                    p = d.add_paragraph(_strip(s.split(". ", 1)[1]), style="List Number")
                    for run in p.runs:
                        _set_run_font(run, "Calibri", 12, ink)
                else:
                    p = d.add_paragraph(_strip(s))
                    for run in p.runs:
                        _set_run_font(run, "Calibri", 12, ink)
        elif kind == "code":
            label = d.add_paragraph()
            r = label.add_run("Code")
            _set_run_font(r, "Calibri", 11, deep, True)
            _code_table(d, text.rstrip("\n"), "1B2140", (244, 247, 255), content_dxa)
        else:
            label = d.add_paragraph()
            r = label.add_run(f"Output ({interpreter})")
            _set_run_font(r, "Calibri", 11, (12, 90, 48), True)
            _code_table(d, text.rstrip("\n") or "(no output)", "E7F6EC", (12, 70, 36), content_dxa)

    d.add_heading("Sources", 1)
    for run in d.paragraphs[-1].runs:
        _set_run_font(run, "Calibri", 18, deep, True)
    src = d.add_table(rows=1 + len(meta["sources"]), cols=2)
    src.style = "Table Grid"
    _cell_text(src.rows[0].cells[0], "Title", 12, (255, 255, 255), True, fill=_hex(deep))
    _cell_text(src.rows[0].cells[1], "URL", 12, (255, 255, 255), True, fill=_hex(deep))
    for i, source in enumerate(meta["sources"], start=1):
        fill = "F7F4FF" if i % 2 else "FFFFFF"
        _cell_text(src.rows[i].cells[0], source["title"], 11, ink, fill=fill)
        _cell_text(src.rows[i].cells[1], source["url"], 10, (20, 60, 120), fill=fill)
    _set_table_widths(src, [3800, 6280])
    end = d.add_paragraph()
    r = end.add_run(
        "Code © CypherMonkeyLabs, MIT. Text CC BY-NC-SA 4.0. "
        "Educational material, not accredited coursework. No outcome is promised."
    )
    _set_run_font(r, "Calibri", 11, (70, 74, 98))
    d.save(out)


def _hex(color):
    return "{:02X}{:02X}{:02X}".format(*color)


def _code_table(doc, text, fill, color, width):
    table = doc.add_table(rows=1, cols=1)
    table.style = "Table Grid"
    _cell_text(table.cell(0, 0), text, 11, color, fill=fill, font="Consolas")
    _set_table_widths(table, [width])
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(6)
