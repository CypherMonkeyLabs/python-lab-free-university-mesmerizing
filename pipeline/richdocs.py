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


def wrap_lines(text, width, keep_indent=False):
    """Wrap without dropping characters. keep_indent is for code."""
    out = []
    width = max(8, int(width))
    for raw in text.replace("\t", "    ").splitlines() or [""]:
        if raw.strip() == "":
            out.append("")
            continue
        if keep_indent:
            bits = textwrap.wrap(
                raw, width=width, replace_whitespace=False, drop_whitespace=False,
                break_long_words=True, break_on_hyphens=False,
            ) or [raw]
        else:
            bits = textwrap.wrap(raw, width=width, break_long_words=True) or [raw]
        out.extend(bits)
    return out


def _norm_text(s):
    return " ".join(str(s).replace("\n", " ").split())


def _unread(text, lines):
    """Characters of text that were not placed in lines. Nothing is dropped on a space break."""
    remaining = str(text).strip()
    for line in lines:
        piece = line.strip()
        if not piece:
            continue
        if remaining.startswith(piece):
            remaining = remaining[len(piece):].lstrip()
            continue
        idx = remaining.find(piece)
        if idx < 0:
            break
        remaining = remaining[idx + len(piece):].lstrip()
    return remaining


def _chars_for(box_w, size, font="Calibri"):
    """Characters that fit on one line, deliberately narrower than the box so PowerPoint does not wrap again."""
    factor = 0.64 if font == "Consolas" else 0.58
    usable = max(0.5, box_w - 0.42)
    return max(8, int(usable / ((size / 72.0) * factor)))


def _line_in(size, spacing):
    return (size * 1.15 + spacing) / 72.0


def fit_lines(text, box_w, box_h, sizes, font="Calibri", spacing=2):
    """Return (lines, size) holding the entire text, or None if the smallest size still overflows the box."""
    clean = str(text).strip()
    if not clean:
        return [""], sizes[-1]
    for size in sizes:
        lines = wrap_lines(clean, _chars_for(box_w, size, font))
        need = 0.20 + len(lines) * _line_in(size, spacing)
        if need <= box_h + 0.02:
            return lines, size
    return None


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


def _text(shape, lines, size, color, bold=False, font="Calibri", align="left", spacing=4, anchor="t"):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    tf._txBody.bodyPr.set("anchor", "ctr" if anchor == "ctr" else "t")
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
    # Lines are already wrapped. A second wrap would add a line the box was not sized for.
    tf.word_wrap = False
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
            specs.append({"kind": "text", "title": title or "Notes", "prose": list(prose), "bullets": list(bullets), "nums": list(nums)})
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
                dot = s.find(". ")
                if 0 < dot <= 2 and s[:dot].isdigit():
                    nums.append(_strip(s[dot + 2:]))
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
    pill = _box(s, 0.45, 0.32, 2.3, 0.46, theme["accent"], rounded=True, radius=0.5)
    _text(pill, [f"LEVEL {int(meta['level']):02d}"], 20, theme["ink"], bold=True, align="center", anchor="ctr")
    title_lines, title_size = fit_lines(meta["title"], 7.6, 1.2, (40, 34, 28, 24))
    title = _box(s, 0.4, 0.86, 7.7, 1.2, theme["bg"])
    _text(title, title_lines, title_size, theme["ink"], bold=True, spacing=2)
    sub_bits = [
        f"About {meta['hours']} hours  ·  Python {meta['python_min']}+",
        "Project: " + meta["project"],
        f"Examples run on {interpreter}",
    ]
    sub_lines = []
    for bit in sub_bits:
        sub_lines.extend(wrap_lines(bit, _chars_for(7.5, 16)))
    sub_h = 0.18 + len(sub_lines) * _line_in(16, 2)
    sub = _box(s, 0.45, 2.12, 7.6, sub_h, theme["card"], line=theme["accent"], rounded=True)
    _text(sub, sub_lines, 16, theme["ink"], spacing=2)
    cols = [theme["accent"], theme["gold"], theme["mint"], theme["pink"]]
    outcomes = list(meta["outcomes"])
    chip_top = 2.12 + sub_h + 0.12
    chip_room = 6.9 - chip_top
    chip_h = min(0.78, (chip_room - 0.06 * (len(outcomes) - 1)) / max(1, len(outcomes)))
    for i, outcome in enumerate(outcomes):
        y = chip_top + i * (chip_h + 0.06)
        chip = _box(s, 0.45, y, 7.6, chip_h, theme["card"], line=cols[i % 4], rounded=True)
        badge = _box(s, 0.58, y + chip_h / 2 - 0.2, 0.4, 0.4, cols[i % 4], rounded=True, radius=0.5)
        _text(badge, [str(i + 1)], 16, theme["ink"], bold=True, align="center", anchor="ctr")
        fitted = fit_lines(outcome, 6.55, chip_h - 0.06, (16, 14, 13, 12, 11), spacing=1)
        if not fitted:
            raise RuntimeError(f"outcome does not fit on the title slide: {outcome}")
        lines, size = fitted
        body = _box(s, 1.12, y + 0.03, 6.75, chip_h - 0.06, theme["card"])
        _text(body, lines, size, theme["ink"], bold=True, spacing=1, anchor="ctr")
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
    outcomes = list(meta["outcomes"])
    n = max(1, len(outcomes))
    gap = 0.18
    top = 1.15
    height = (5.75 - gap * (n - 1)) / n
    for i, outcome in enumerate(outcomes):
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
        fitted = fit_lines(outcome, 10.5, height - 0.2, (28, 24, 22, 18, 16), spacing=2)
        if not fitted:
            raise RuntimeError(f"outcome does not fit on the outcomes slide: {outcome}")
        lines, size = fitted
        ink_h = 0.08 + len(lines) * _line_in(size, 2)
        words = _box(s, 1.45, y + (height - ink_h) / 2, 10.6, ink_h, theme["card"])
        _text(words, lines, size, theme["ink"], bold=True, spacing=2, anchor="ctr")

    for spec in specs:
        if spec["kind"] == "text":
            _text_slides(new, theme, spec, cols)
        else:
            _code_slides(new, theme, spec, interpreter)
    _sources_slides(new, theme, meta)
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


_ICONS = (MSO_SHAPE.OVAL, MSO_SHAPE.HEXAGON, MSO_SHAPE.DIAMOND, MSO_SHAPE.PENTAGON, MSO_SHAPE.CHEVRON)


def _title_band(slide, theme, title):
    """Draw the slide title and return the y where the body may start. The title never covers that y."""
    lines, size, h = None, 18, 0.8
    for candidate in (32, 28, 24, 20, 18):
        lines = wrap_lines(title, _chars_for(12.3, candidate))
        h = 0.14 + len(lines) * _line_in(candidate, 2)
        size = candidate
        if h <= 1.35:
            break
    band = _box(slide, 0.4, 0.2, 12.5, h, theme["bg"])
    _text(band, lines, size, theme["ink"], bold=True, spacing=2)
    return 0.2 + h + 0.12


def _paint_card(slide, theme, text, x, y, w, h, color, mark, icon):
    """Coloured card. Every word of text is drawn, or the leftover is returned for the next slide."""
    _box(slide, x, y, w, h, mix(color, (255, 255, 255), 0.5), line=color, rounded=True, radius=0.1)
    text_left = 1.2
    text_w = w - text_left - 0.22
    fitted = fit_lines(text, text_w, h - 0.16, (30, 26, 22, 18, 16, 14), spacing=2)
    if fitted:
        lines, size = fitted
        rest = ""
    else:
        lines = wrap_lines(text.strip(), _chars_for(text_w, 14))
        size = 14
        cap = max(1, int((h - 0.2) / (_line_in(14, 2) + 0.08)))
        shown, tail = lines[:cap], lines[cap:]
        lines = shown
        rest = _unread(text, shown)
    rows = max(1, len(lines))
    gap = 0.08
    row_h = (h - 0.16 - gap * (rows - 1)) / rows
    for i, line in enumerate(lines):
        ry = y + 0.08 + i * (row_h + gap)
        inner = mix(color, (255, 255, 255), 0.78 if i % 2 == 0 else 0.9)
        _box(slide, x + 0.1, ry, w - 0.2, row_h, inner, line=color, rounded=True, radius=0.15)
        icon_d = min(0.84, max(0.36, row_h - 0.1))
        ix = x + 0.2
        iy = ry + (row_h - icon_d) / 2
        shape = slide.shapes.add_shape(icon, PInches(ix), PInches(iy), PInches(icon_d), PInches(icon_d * (0.72 if icon == MSO_SHAPE.CHEVRON else 1)))
        shape.fill.solid()
        shape.fill.fore_color.rgb = prgb(color)
        shape.line.fill.background()
        label = mark if i == 0 and mark else "›"
        _text(shape, [label], 14 if icon_d < 0.5 else 18, theme["ink"], bold=True, align="center", anchor="ctr")
        tb = _box(slide, x + text_left, ry, text_w, row_h, inner)
        _text(tb, [line], size, theme["ink"], bold=True, spacing=0, anchor="ctr")
    return rest


def _text_slides(new, theme, spec, cols):
    numbered = bool(spec["nums"]) and not spec["bullets"]
    items = spec["bullets"] or spec["nums"] or spec["prose"] or ["See the guide for the full wording."]
    queue = [(text, i) for i, text in enumerate(items)]
    part = 0
    while queue:
        part += 1
        slide = new()
        title = spec["title"] if part == 1 else f"{spec['title']}  (continued)"
        top = _title_band(slide, theme, title)
        bottom = 6.92
        room = bottom - top
        batch = []
        used = 0.0
        while queue and len(batch) < 4:
            text, idx = queue[0]
            need = max(1.15, 0.24 + len(wrap_lines(text, _chars_for(11.0, 22))) * _line_in(22, 2))
            if batch and used + 0.1 + need > room:
                break
            batch.append(queue.pop(0))
            used += need + 0.1
            if need > room:
                break
        n = len(batch)
        gap = 0.1
        height = (room - gap * (n - 1)) / n
        for i, (text, idx) in enumerate(batch):
            y = top + i * (height + gap)
            rest = _paint_card(
                slide, theme, text, 0.38, y, 12.55, height,
                cols[idx % 4], str(idx + 1) if numbered else "", _ICONS[idx % len(_ICONS)],
            )
            if rest:
                queue.insert(0, (rest, idx))


def _chunk_lines(lines, box_h, size, spacing):
    cap = max(1, int((box_h - 0.08) / _line_in(size, spacing)))
    return chunked(lines, cap)


def _best_mono(text, box_w, sizes):
    """Largest font that keeps each source line whole. Wrap only when the smallest size still overflows."""
    raw = text.replace("\t", "    ").splitlines() or [""]
    longest = max((len(line) for line in raw), default=0)
    chosen = sizes[-1]
    for size in sizes:
        if longest <= _chars_for(box_w, size, "Consolas"):
            chosen = size
            break
    return wrap_lines(text, _chars_for(box_w, chosen, "Consolas"), keep_indent=True), chosen


def _code_slides(new, theme, spec, interpreter):
    # Body widths are the text boxes inside the panels (panel width minus the inset).
    full_body_w = 12.21
    side_body_w = 7.31
    out_side_w = 4.22
    code_lines, code_size = _best_mono(spec["code"], full_body_w, (18, 16, 15, 14))
    parts = _chunk_lines(code_lines, 4.5, code_size, 1)
    if spec["out"]:
        out_lines, out_size = _best_mono(spec["out"], 12.0, (16, 14, 13, 12))
        out_parts = _chunk_lines(out_lines, 4.3, out_size, 1)
    else:
        out_lines, out_size, out_parts = [], 16, []
    # Share the slide only when every line already fits the narrow column. A second wrap would overflow.
    side_by_side = False
    if len(parts) == 1 and len(out_parts) == 1:
        side_chars = _chars_for(side_body_w, code_size, "Consolas")
        out_chars = _chars_for(out_side_w, out_size, "Consolas")
        side_by_side = all(len(line) <= side_chars for line in parts[0]) and all(len(line) <= out_chars for line in out_parts[0])
    for i, part in enumerate(parts):
        slide = new()
        title = spec["title"] + ("" if len(parts) == 1 else f"  ({i + 1}/{len(parts)})")
        top = _title_band(slide, theme, title)
        show_out = side_by_side and i == len(parts) - 1
        code_w = 7.55 if show_out else 12.45
        panel_h = 6.92 - top
        _box(slide, 0.4, top, code_w, panel_h, theme["code_bg"], rounded=True, radius=0.08)
        header = _box(slide, 0.4, top, code_w, 0.4, mix(theme["accent"], theme["code_bg"], 0.35))
        _text(header, ["Python"], 16, theme["gold"], bold=True, anchor="ctr")
        body = _box(slide, 0.52, top + 0.46, code_w - 0.24, panel_h - 0.58, theme["code_bg"])
        _text(body, part, code_size, theme["code_fg"], font="Consolas", spacing=1)
        if show_out:
            _box(slide, 8.15, top, 4.75, panel_h, theme["out_bg"], line=theme["out_fg"], rounded=True, radius=0.08)
            oh = _box(slide, 8.15, top, 4.75, 0.4, mix((46, 160, 90), (255, 255, 255), 0.2))
            _text(oh, ["Output"], 16, theme["out_fg"], bold=True, anchor="ctr")
            ob = _box(slide, 8.28, top + 0.48, 4.5, panel_h - 1.15, theme["out_bg"])
            _text(ob, out_parts[0], out_size, theme["out_fg"], font="Consolas", spacing=1)
            cap_lines, cap_size = fit_lines(f"Printed by {interpreter}. Not invented.", 4.4, 0.55, (13, 12, 11), spacing=1)
            cap = _box(slide, 8.28, top + panel_h - 0.62, 4.5, 0.52, theme["out_bg"])
            _text(cap, cap_lines, cap_size, theme["out_fg"], spacing=0)
        elif not out_parts:
            cap = _box(slide, 0.55, top + panel_h - 0.48, code_w - 0.3, 0.4, theme["code_bg"])
            _text(cap, ["Code from this Level's guide. Run it yourself to see the output."], 13, theme["gold"], anchor="ctr")
    if not side_by_side:
        for j, part in enumerate(out_parts):
            slide = new()
            top = _title_band(slide, theme, spec["title"] + f"  output ({j + 1}/{len(out_parts)})")
            panel_h = 6.92 - top
            _box(slide, 0.4, top, 12.45, panel_h, theme["out_bg"], line=theme["out_fg"], rounded=True, radius=0.08)
            oh = _box(slide, 0.4, top, 12.45, 0.4, mix((46, 160, 90), (255, 255, 255), 0.2))
            _text(oh, ["Output"], 16, theme["out_fg"], bold=True, anchor="ctr")
            ob = _box(slide, 0.55, top + 0.5, 12.15, panel_h - 1.15, theme["out_bg"])
            _text(ob, part, out_size, theme["out_fg"], font="Consolas", spacing=1)
            note = f"Printed by {interpreter}. Not invented."
            cap_lines, cap_size = fit_lines(note, 12.0, 0.5, (14, 12), spacing=1)
            cap = _box(slide, 0.55, top + panel_h - 0.58, 12.15, 0.46, theme["out_bg"])
            _text(cap, cap_lines, cap_size, theme["out_fg"])


def _sources_slides(new, theme, meta):
    sources = list(meta["sources"])
    groups = chunked(sources, 5)
    for gi, group in enumerate(groups):
        slide = new()
        title = "Sources and licence" if gi == 0 else "Sources and licence  (continued)"
        top = _title_band(slide, theme, title)
        foot_h = 1.25 if gi == len(groups) - 1 else 0
        room_bottom = 6.92 - foot_h - 0.08
        n = max(1, len(group))
        gap = 0.1
        height = (room_bottom - top - gap * (n - 1)) / n
        for i, src in enumerate(group):
            y = top + i * (height + gap)
            card = _box(slide, 0.4, y, 12.5, height, theme["card"], line=theme["accent"], rounded=True)
            blob = slide.shapes.add_shape(MSO_SHAPE.HEXAGON, PInches(0.55), PInches(y + height / 2 - 0.22), PInches(0.44), PInches(0.44))
            blob.fill.solid()
            blob.fill.fore_color.rgb = prgb(theme["accent"])
            blob.line.fill.background()
            _text(blob, [str(gi * 5 + i + 1)], 14, theme["ink"], bold=True, align="center", anchor="ctr")
            fitted = fit_lines(src["title"] + "\n" + src["url"], 11.2, height - 0.08, (16, 14, 12), spacing=1)
            if not fitted:
                raise RuntimeError(f"source does not fit: {src['title']}")
            lines, size = fitted
            body = _box(slide, 1.15, y + 0.04, 11.55, height - 0.08, theme["card"])
            _text(body, lines, size, theme["ink"], spacing=1, anchor="ctr")
        if foot_h:
            foot = _box(slide, 0.4, 6.92 - foot_h, 12.5, foot_h, mix(theme["accent"], (255, 255, 255), 0.72), line=theme["accent_deep"], rounded=True)
            _text(foot, [
                "Code © CypherMonkeyLabs, MIT.  Text CC BY-NC-SA 4.0.",
                "Educational material, not accredited coursework. No outcome is promised.",
                "Python is a trademark of the Python Software Foundation.",
            ], 15, theme["ink"], spacing=1)


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
