# Contributing to Python Lab

Python Lab is a free static site. Thanks for helping. Small, reviewable PRs are best.

## Ground rules
- **Truth first.** Every factual claim needs a source id from `js/content/sources.js`. Code that shows output must have been run on the lab's runtime (Pyodide 314.0.7, CPython 3.14.2). If not run, say so on the page.
- **No income, salary or hiring promises.** No "best" or "guaranteed".
- **Licences.** Code you add is MIT; text, diagrams and media are CC BY-NC-SA 4.0. Do not paste text, problem sets or images from other sites. Link and paraphrase. New vendored files must be added to `THIRD_PARTY_MANIFEST.json` and `THIRD_PARTY_NOTICES.md`; new assets to `PROVENANCE.md`.
- **No CDN, no trackers.** Everything loads from this origin.
- **Accessible by default.** Keyboard reachable, visible focus, works at 390 px wide, respects reduced motion, readable in all four themes (ink, paper, terminal, contrast).
- **Lab standard.** Footer disclaimer, top bar, left menu, bottom bar, bot and first-visit popup must keep working. See the visitor checklist the maintainers use.

## Workflow
1. Open an issue (bug, content correction, or idea) or comment on an existing one.
2. Branch from `main`, make one focused change.
3. Run what applies:
   - `python3 scripts/licence_manifest.py`
   - `python3 scripts/csp_check.py`
   - `npm install && npx playwright test` (serves the site on 127.0.0.1:41731)
4. Open a PR using the template. Maintainers squash-merge after review; the site deploys from `main` via GitHub Pages.
5. Binary files (images, PDFs, wheels, and the level PDF/DOCX/PPTX/PNG guides) go in as base64 parts under `_b64/`. Pack the level guides with `python3 pipeline/build_downloads.py --content content --out downloads/modules --pack-b64`. Check a local decode with `python3 pipeline/restore_binaries.py --check` (that command keeps `_b64`). The `Restore binary assets` workflow (`.github/workflows/restore-binaries.yml`) decodes on `main`, deletes `_b64`, checks `SHA256SUMS`, and commits the binaries. Do not commit the decoded binaries on a feature branch.

## Reporting a mistake in a lesson
Use the "Content correction" issue form with the lesson URL, what is wrong, and a source. Corrections are a priority; there is no guaranteed response time yet (to be set by the maintainer).

## Conduct
Be kind, assume good faith, no harassment. Maintainers may remove content or comments that break this.
