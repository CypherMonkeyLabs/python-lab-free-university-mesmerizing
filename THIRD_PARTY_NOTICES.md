# Third-party notices

Python Lab's own code is MIT and its own text, diagrams and media are CC BY-NC-SA 4.0 (see `LICENSE`). The pieces below are not ours. Each is listed with version, licence, source and the file(s) in this repo. Hashes live in `THIRD_PARTY_MANIFEST.json` and are checked by `python3 scripts/licence_manifest.py`. Licence texts we ship are in `licenses/`.

Licences were read on 2026-10-17 from the upstream LICENSE files or the wheel METADATA. Where a licence text is not copied into `licenses/`, the column says where it is.

## Shipped to visitors

| Component | Version | Licence | Source | Files | Licence text |
|---|---|---|---|---|---|
| Pyodide | 314.0.7 | MPL-2.0 | https://github.com/pyodide/pyodide | `vendor/pyodide/pyodide.mjs`, `pyodide.asm.mjs`, `pyodide.asm.wasm`, `pyodide-lock.json` | `licenses/MPL-2.0-pyodide.txt` |
| CPython standard library | 3.14.2 | PSF-2.0 | https://docs.python.org/3/license.html | `vendor/pyodide/python_stdlib.zip` | upstream URL |
| NumPy | 2.4.6 | BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 | https://github.com/numpy/numpy | `vendor/pyodide/numpy-2.4.6-*.whl` | inside the wheel (`LICENSE.txt`) |
| pandas | 3.0.2 | BSD-3-Clause | https://github.com/pandas-dev/pandas | `vendor/pyodide/pandas-3.0.2-*.whl` | inside the wheel |
| python-dateutil | 2.9.0.post0 | Apache-2.0 OR BSD-3-Clause | https://github.com/dateutil/dateutil | `vendor/pyodide/python_dateutil-*.whl` | inside the wheel |
| pytz | 2026.1.post1 | MIT | https://github.com/stub42/pytz | `vendor/pyodide/pytz-*.whl` | inside the wheel |
| six | 1.17.0 | MIT | https://github.com/benjaminp/six | `vendor/pyodide/six-*.whl` | inside the wheel |
| Mermaid | 11.12.2 | MIT | https://github.com/mermaid-js/mermaid | `vendor/mermaid.min.js` | `licenses/MIT-mermaid.txt` |
| Atkinson Hyperlegible | as shipped | OFL-1.1 | https://github.com/googlefonts/atkinson-hyperlegible | `assets/fonts/atkinson-*.woff2` | `licenses/OFL-atkinson-hyperlegible.txt` |
| Fraunces | as shipped | OFL-1.1 | https://github.com/undercasetype/Fraunces | `assets/fonts/fraunces-560.woff2` | `licenses/OFL-fraunces.txt` |
| IBM Plex Mono | as shipped | OFL-1.1 | https://github.com/IBM/plex | `assets/fonts/plex-mono-400.woff2` | `licenses/OFL-ibm-plex.txt` |
| canvas-confetti (confetti on wins, loaded lazily, same-origin) | 1.9.3 | ISC | https://github.com/catdad/canvas-confetti | `vendor/confetti.browser.min.js` | `licenses/ISC-canvas-confetti.txt` |
| Archify viewer code and embedded JetBrains Mono (inside each `diagrams/*.html`) | see `diagrams/NOTICE.md` | MIT (Archify); JetBrains Mono is OFL-1.1 | https://github.com/tt-a1i/archify | `diagrams/*.html` | `diagrams/NOTICE.md` (JetBrains Mono OFL text not yet copied: listed as a follow-up in `docs/LICENCE_READS.md`) |
| three.js (tree-shaken subset, WebGL renderer, geometries, basic materials, sprites) | r186 (npm 0.186.1) | MIT, Copyright 2010-2026 three.js authors | https://github.com/mrdoob/three.js | `vendor/three/three.subset.min.js` (built from `vendor/three/subset.js`) | `vendor/three/LICENSE` |
| Archify viewer code inside the level map and architecture diagrams | as of 2026-10-17 | MIT (Archify); embedded JetBrains Mono is OFL-1.1 | https://github.com/tt-a1i/archify | `diagrams/level_map.html`, `diagrams/pylab_v2_architecture.html` | `diagrams/NOTICE.md` |
| Downloadable level modules (PDF, DOCX, PPTX, HTML, PNG) | generated | Text CC BY-NC-SA 4.0, code samples MIT | this repo, `pipeline/build_downloads.py` | `downloads/modules/*` | `LICENSE` |

The shaders (`js/studio/aurora.js`, the probe in `js/studio/tiers.js`), scene modules, Py's hint ladders and poster art are original to this lab.

## Used only to build or test (not shipped)

| Tool | Licence | Source |
|---|---|---|
| Playwright test runner 1.56.1 | Apache-2.0 | https://github.com/microsoft/playwright (`licenses/Apache-2.0-playwright.txt`) |
| fpdf2 (cheat-sheet PDFs, `scripts/make_pdfs.py`) | LGPL-3.0, build-time only; output is not a derived work of the library | https://github.com/py-pdf/fpdf2 |
| WeasyPrint (level PDFs, `pipeline/build_downloads.py`) | BSD-3-Clause | https://github.com/Kozea/WeasyPrint |
| python-docx / python-pptx (level DOCX / PPTX) | MIT | https://github.com/python-openxml/python-docx , https://github.com/scanny/python-pptx |
| Python-Markdown, PyYAML | BSD-3-Clause, MIT | https://github.com/Python-Markdown/markdown , https://github.com/yaml/pyyaml |
| Pillow (cover PNG) | MIT-CMU (HPND) | https://github.com/python-pillow/Pillow |
| DejaVu fonts (used at build for PNG/PDF text; not shipped) | Bitstream Vera licence + public domain changes | https://dejavu-fonts.github.io/ |
| esbuild (bundles the three.js subset) | MIT | https://github.com/evanw/esbuild |
| ffmpeg (clips, `scripts/make_media.py`) | LGPL/GPL depending on build; build-time only, no ffmpeg code shipped | https://ffmpeg.org/legal.html |

## Not used (read, for the record)
See `docs/LICENCE_READS.md` for Skulpt, CodeMirror 6, axe-core, DOMPurify and Blockly. None is vendored yet.

## Trademarks
"Python" and the Python logos belong to the Python Software Foundation (https://www.python.org/psf/trademarks/). This lab is independent and unaffiliated.

## Library search for the visual build (2026-10-17)
`libsearch.py --safe` was run for confetti, particles, Blockly, Pong/Snake and turtle graphics. The index had no canvas-confetti or tsParticles entry, so canvas-confetti was vendored from upstream after reading its ISC licence. Candidates considered and **not** used: tsParticles (MIT, heavy for our need: the lab draws its own light particle canvas), Phaser (MIT, cm-01774) and two.js (MIT, cm-02609) for games (the lab's games are small hand-written canvas/DOM code), Blockly (Apache-2.0, large; the block-to-Python challenge is hand-written drag and drop). No code from those projects is in this repo.
