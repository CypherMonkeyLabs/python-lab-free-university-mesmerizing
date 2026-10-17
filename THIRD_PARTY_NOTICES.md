# Third-party notices (added by PR3: studio shell, Download Center)

Python Lab's own code is MIT and its own text, diagrams and media are CC BY-NC-SA 4.0 (see `LICENSE`).
If the Foundations PR (#7) is merged first, merge these rows into its `THIRD_PARTY_NOTICES.md` table; only the rows below come from this PR.

## Shipped to visitors

| Component | Version | Licence | Source | Files | Licence text |
|---|---|---|---|---|---|
| three.js (tree-shaken subset, WebGL renderer, geometries, basic materials, sprites) | r186 (npm 0.186.1) | MIT, Copyright 2010-2026 three.js authors | https://github.com/mrdoob/three.js (library index id cm-01623) | `vendor/three/three.subset.min.js` (built from `vendor/three/subset.js`) | `vendor/three/LICENSE` |
| Archify viewer code inside two new diagrams | as of 2026-10-17 | MIT (Archify); embedded JetBrains Mono is OFL-1.1 | https://github.com/tt-a1i/archify (library index id cm-01651) | `diagrams/level_map.html`, `diagrams/pylab_v2_architecture.html` | `diagrams/NOTICE.md` |
| Downloadable files (PDF, DOCX, PPTX, HTML, PNG) | generated | Text CC BY-NC-SA 4.0, code samples MIT; produced with the tools below | this repo, `pipeline/build_downloads.py` | `downloads/modules/*` | `LICENSE` |

The two shaders (`js/studio/aurora.js` and the probe in `js/studio/tiers.js`), all scene modules, Py's hint ladders and the poster art are original to this lab.

## Used only to build (not shipped as code)

| Tool | Licence | Source |
|---|---|---|
| WeasyPrint (PDF) | BSD-3-Clause | https://github.com/Kozea/WeasyPrint |
| python-docx (DOCX) | MIT | https://github.com/python-openxml/python-docx |
| python-pptx (PPTX) | MIT | https://github.com/scanny/python-pptx |
| Python-Markdown | BSD-3-Clause | https://github.com/Python-Markdown/markdown |
| PyYAML | MIT | https://github.com/yaml/pyyaml |
| Pillow (cover PNG) | MIT-CMU (HPND) | https://github.com/python-pillow/Pillow |
| DejaVu fonts (used by the build for PNG and PDF text; not shipped as font files) | Bitstream Vera licence + public domain changes | https://dejavu-fonts.github.io/ |
| esbuild (bundles the three.js subset) | MIT | https://github.com/evanw/esbuild |
| Playwright (visitor tests) | Apache-2.0 | https://github.com/microsoft/playwright |

## Library-first search (2026-10-17)
`libsearch` queries "three.js 3d", "webgl scene", "parallax", "archify diagram", "tutor mascot bot". Picked: three.js (MIT), Archify (MIT). Parallax and the mascot are small original code; the tutor-bot results (DeepTutor, RAG demos) are LLM apps and were not used (Py is rule-based and offline).

## Trademarks
"Python" and the Python logos belong to the Python Software Foundation. This lab is independent and unaffiliated; Py uses original art, not the Python logo.
