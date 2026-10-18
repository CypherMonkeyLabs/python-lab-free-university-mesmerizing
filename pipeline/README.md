# Download pipeline

`build_downloads.py` turns `content/<module>/module.md` (YAML front matter + Markdown) into the files in `downloads/modules/`:
guide PDF (WeasyPrint), worksheet DOCX (python-docx), slides PPTX (python-pptx), guide HTML, cover PNG (Pillow), description JSON/TXT and `manifest.json`.
Every ```` ```python run ```` block is executed (isolated interpreter, 10 s limit) and its output is embedded; a failing block aborts the build.

    pip install markdown pyyaml weasyprint python-docx python-pptx pillow
    python3 pipeline/build_downloads.py --content content --out downloads/modules --pack-b64

`pdfinfo` (poppler-utils) is used to re-open each PDF after it is written. Filenames look like `Python-Lab_Level-00_First-Program_Guide.pdf` (level, title slug, kind).

Binary outputs (pdf, docx, pptx, png) are stored in git as base64 text under `_b64/`. `--pack-b64` splits each file into parts named `<path>.b64.001`, `.002`, … and rewrites the `downloads/modules/` lines in `SHA256SUMS`. Text outputs (html, json, txt, manifest) are committed as they are.

`node pipeline/build_pybot_index.mjs` writes `js/content/pybot-index.json` for Py's offline chat. It reads the lesson modules, hints, downloads, and glossary already in the repo. Re-run it after changing those sources, then `node tests/pybot-eval.mjs`.

`python3 pipeline/restore_binaries.py` decodes every part back into the tree and leaves `_b64` in place. `--check` compares the decoded bytes with `SHA256SUMS` and writes nothing. `.github/workflows/restore-binaries.yml` is the copy that runs on `main`: it decodes, deletes `_b64`, checks the sums, and pushes the binaries. The two decoders use the same part names.
