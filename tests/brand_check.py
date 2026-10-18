#!/usr/bin/env python3
"""Confirm download branding without opening a GUI."""

from __future__ import annotations

import sys
import zipfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "cyphermonkeylabs.com"
MODULES = ROOT / "downloads" / "modules"


def main() -> int:
    html = next(MODULES.glob("*.html"))
    text = html.read_text(encoding="utf-8")
    assert "cm-dl-brand" in text and DOMAIN in text, html

    pdf = next(MODULES.glob("*.pdf"))
    sample = PdfReader(str(pdf)).pages[0].extract_text() or ""
    assert DOMAIN in sample, pdf

    docx = next(MODULES.glob("*.docx"))
    with zipfile.ZipFile(docx) as archive:
        blob = "\n".join(
            archive.read(name).decode("utf-8", "ignore")
            for name in archive.namelist()
            if name.startswith("word/footer") or name == "word/document.xml"
        )
    assert DOMAIN in blob, docx

    pptx = next(MODULES.glob("*.pptx"))
    with zipfile.ZipFile(pptx) as archive:
        slides = "\n".join(
            archive.read(name).decode("utf-8", "ignore")
            for name in archive.namelist()
            if name.startswith("ppt/slides/slide")
        )
    assert DOMAIN in slides, pptx

    png = next(MODULES.glob("*.png"))
    info = Image.open(png).info
    assert info.get("cm-brand") == DOMAIN, (png, info)

    sheet = next((ROOT / "downloads").glob("*.pdf"))
    sheet_text = PdfReader(str(sheet)).pages[0].extract_text() or ""
    assert DOMAIN in sheet_text, sheet
    print("brand check ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
