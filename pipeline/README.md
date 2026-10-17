# Download pipeline

`build_downloads.py` turns `content/<module>/module.md` (YAML front matter + Markdown) into the files in `downloads/modules/`:
guide PDF (WeasyPrint), worksheet DOCX (python-docx), slides PPTX (python-pptx), guide HTML, cover PNG (Pillow), description JSON/TXT and `manifest.json`.
Every ```` ```python run ```` block is executed (isolated interpreter, 10 s limit) and its output is embedded; a failing block aborts the build.

    pip install markdown pyyaml weasyprint python-docx python-pptx pillow
    python3 pipeline/build_downloads.py --out downloads/modules

Binary outputs (pdf, docx, pptx, png) are stored in git as base64 text under `_b64/` (see `.github/workflows/restore-binaries.yml`): the workflow decodes them on `main`. Text outputs are committed as they are.
