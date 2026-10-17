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
- Diagrams drawn with vendored Mermaid.
- Read-aloud through the browser’s own speech synthesis. The voice depends on the device.
- Short original GIF, WebM, and MP4 clips under `media/`.
- Cheat sheets in `downloads/` as PDF and plain text.

Regenerate the clips with `python3 scripts/make_media.py` (needs ffmpeg). Regenerate the sheets with `python3 scripts/make_pdfs.py` (needs [fpdf2](https://pypi.org/project/fpdf2/)).

## Checks

The site itself does not need Node. The Playwright suite does:

```bash
npm install
npx playwright install chromium
npx playwright test
```

## Publish

The files are meant to be served as a directory, including under a longer path such as `https://cyphermonkeylabs.com/python-lab-free-university-mesmerizing/`. Links to CSS, scripts, clips, and downloads are relative, so that address needs its trailing slash. `.nojekyll` is included so GitHub Pages serves the runtime files. `sw.js` is registered with scope `./`, which is this directory and not the rest of the host. No CDN is required at runtime.
