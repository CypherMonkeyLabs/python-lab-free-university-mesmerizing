# Content spine (PR2)

`data/lesson-map.json` maps the **54 existing lessons** onto Levels 0-10 of the course map. Nothing is renamed or removed and no lesson text changed.

| File | Purpose |
|---|---|
| `data/lesson-map.json` | Front matter per lesson: level, outcomes, sources (same ids as the lesson file), `python_min`, minutes, `last_verified` |
| `data/lesson-schema.json` | The field list and rules |
| `scripts/validate_lessons.mjs` | `node scripts/validate_lessons.mjs`: every catalog lesson has a level, at least one outcome and only known source ids; fails on drift between map and lesson files |
| `scripts/version_watch.py` | Compares the lab's "newest Python" claim with the python.org release API and PEP 790. Reports, never edits |
| `scripts/link_watch.py` | HTTP-checks all 97 source URLs in `js/content/sources.js` |
| `docs/LEARNING_SCIENCE_SOURCES.md` | Verified bibliographic references for teaching techniques |

## Honest status
- **Levels and outcomes are a first draft** written from each lesson's title and summary, not from re-reading every lesson body. Lucky should review the level placement (for example `dsa/stacks` is placed at Level 7 and `fundamentals/classes` at Level 5 following the course map).
- **Nothing in the UI shows levels yet.** This PR is data and tooling only; the level view comes with the later learning-engine/worlds PRs.
- `last_verified` is `null` for all 54 until a human re-checks each lesson and runs its code.
- The map's "sources" are the ones the lessons already cite; PR2 did not add new claims or sources.
- CI wiring is not included: the scripts run locally (`node scripts/validate_lessons.mjs`, `python3 scripts/version_watch.py`, `python3 scripts/link_watch.py`).
