# Python Lab

Python Lab is a free static study studio for Python. It is meant to stay useful from a first `print` through interview practice. The pages are HTML, CSS, and JavaScript. There is no build step. GitHub Pages can serve the repository root as-is.

Lucky, a lifelong student and an AI enthusiast moving into AI omni-channel agents, shares what he is learning. Facts are cited in the Sources section. The lab does not estimate pay.

## Run it locally

```bash
python3 -m http.server 41731 --bind 127.0.0.1
```

Open http://127.0.0.1:41731

## What’s in the page

- Lessons from syntax through objects, tests, async, typing, the standard library, Flask and FastAPI, NumPy and pandas, models and agents, automation, tooling, licensing, certifications, career study order, and projects.
- A browser Python runtime: Pyodide 314.0.7, which is CPython 3.14.2, plus vendored NumPy 2.4.6 and pandas 3.0.2. Python 3.15.0 (9 October 2026) is newer than this runtime. Lessons say so when syntax is 3.15-only.
- Checks on the exercises, quizzes, and three games: guess, snake, and a text adventure.
- CSS 3D rooms, with a flat list when the browser asks for reduced motion.
- Diagrams drawn with vendored Mermaid, plus 8 interactive Archify showcase diagrams under `diagrams/` (specs in `diagrams/specs/`; see `diagrams/NOTICE.md`).
- 9 slide decks (92 slides, arrow keys or swipe, full screen, print) and 11 guides. Code samples that show an output were run on Pyodide 314 first.
- A first-visit how-to popup (Help button, `?` key), a colourful helper bot, and the lab footer with the shared disclaimer.
- Read-aloud through the browser’s own speech synthesis. The voice depends on the device.
- Short original GIF, WebM, and MP4 clips under `media/`.
- Cheat sheets in `downloads/` as PDF and plain text, the slides as Markdown, and a Jupyter notebook of code samples. Regenerate those two with `node scripts/make_downloads.mjs`.

Regenerate the clips with `python3 scripts/make_media.py` (needs ffmpeg). Regenerate the sheets with `python3 scripts/make_pdfs.py` (needs [fpdf2](https://pypi.org/project/fpdf2/)).

## Checks

The site itself does not need Node. The Playwright suite does:

```bash
npm install
npx playwright install chromium
npx playwright test
```

## Test matrix

`npx playwright test` runs the end-to-end suite. `python3 tests/matrix.py <base-url> <out-dir>` (Python Playwright) runs the theme and viewport matrix: 4 themes x desktop 1440x900 and touch 390x844, covering every route, menu item, help, search, bot, footer and slides, and writes `results.json` plus screenshots.

## Publish

The files are meant to be served as a directory, including under a longer path such as `https://cyphermonkeylabs.com/python-lab-free-university-mesmerizing/`. Links to CSS, scripts, clips, and downloads are relative, so that address needs its trailing slash. `.nojekyll` is included so GitHub Pages serves the runtime files. `sw.js` is registered with scope `./`, which is this directory and not the rest of the host. No CDN is required at runtime.

## 3D studio, Py teacher, Downloads
- **Worlds** (`#/worlds`, `#/worlds/0` through `#/worlds/10`): each Level has its own three.js scene. The lobby keeps a shared still. three.js is vendored (`vendor/three/`, MIT) and loads only on pages with a scene. Tap or click a scene and it reacts. Reduced motion keeps the still picture.
- **Quality tiers** (Display menu): Auto, Off (still), Flat (CSS parallax), Light (WebGL, 30 fps cap, DPR 1.5), Full (60 fps cap, DPR 2, aurora). Auto honours reduced motion and Save-Data and runs a short GPU probe. `?quality=full` overrides for testing. Read-only numbers: `window.__labStudio`.
- **Py** has a four-rung hint ladder per exercise (hand-written for 13 exercises, generic for the rest), Socratic prompts, and tap/drag/drop/win/fail reactions. No stored solutions, no AI service.
- **Downloads.** The page route is `#/downloads`. `#/download-center` is the same page (top bar and footer use that alias). GitHub renders a markdown link whose target starts with `#/` as an in-file heading anchor, so this README names both routes in code spans instead of a markdown link. A module appears when `content/<slug>/module.md` exists (Levels 0–10 in this tree). Rebuild with `python3 pipeline/build_downloads.py --content content --out downloads/modules --pack-b64`.
- **Binary files.** PDF, DOCX, PPTX and PNG are not committed as binaries. `pipeline/build_downloads.py --pack-b64` writes base64 parts under `_b64/` (about 100000 characters each, named `<path>.b64.001`, `.002`, …) and refreshes the matching lines in `SHA256SUMS`. HTML, JSON and TXT stay as text. Locally, `python3 pipeline/restore_binaries.py` decodes the parts and **keeps** `_b64`. Pass `--check` to compare hashes without writing. The GitHub Action `.github/workflows/restore-binaries.yml` runs on a push to `main` that changes `_b64/**` (and on workflow_dispatch): it joins the parts, decodes them, deletes `_b64`, checks `SHA256SUMS`, and commits the binaries to `main` with message `Restore binary assets [skip ci]`. Do not push those binaries from a feature branch.
