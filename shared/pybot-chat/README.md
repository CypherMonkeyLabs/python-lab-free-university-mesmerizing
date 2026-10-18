# Py chat (offline)

A small, copyable chat for a static lab. It answers from a JSON index built out of that lab's own pages. There is no cloud model, no API key, and no request off the site.

Python Lab uses it inside Py's panel. Another lab can copy this folder and point the builder at its own content.

## Files

| File | Role |
| --- | --- |
| `engine.js` | Tokenise, stem, synonyms, BM25, a short fuzzy pass, and intent rules. No DOM. |
| `ui.js` | Message list, suggestion chips, Mic, Send, Clear. The host supplies the words. |
| `chat.css` | Layout for the dock. It expects the lab's colour variables (`--ink`, `--bg`, `--accent`, `--line`). |

The index is not in this folder. Python Lab writes it to `js/content/pybot-index.json` with:

```
node pipeline/build_pybot_index.mjs
```

Check retrieval with:

```
node tests/pybot-eval.mjs
```

## Wiring

1. Import `createRetriever` from `engine.js` and `fetch` the index (same origin).
2. Put `chatMarkup()` in the bot panel and call `paintChat` when messages change.
3. On Send, Enter, a chip, or the mic transcript, call `retriever.ask(text, host)`.
4. Show `text`, then a link when `href` is set. The link label is `link` (`Open this lesson` for a lesson).
5. One follow-up chip uses `follow` / `followQ`. `ask` remembers a single previous turn, so "and in a dict?" and "show an example" can continue it.
6. If nothing scores, the text says the lab does not have that yet. Do not replace it with a guessed fact.
7. Precache `engine.js`, `ui.js`, `chat.css`, and the index in the service worker.

`host.progress` can return `{ done, total, xpLevel, nextHref, nextTitle }` for "what level am I". Omit it and the level reply stays generic.

## What an answer is allowed to say

Excerpts come from the index fields `ex` and `eg`, which the builder copies out of lessons, hints, downloads, the glossary, games, and media. The engine does not write new facts. Greetings, the level line, and the "I don't have that yet" line are the only fixed sentences, and they do not claim a Python rule.

Recorded voices in Python Lab are fixed clips. Read aloud uses the browser voice for an answer sentence. The voice picker still chooses those clips for the audio lessons.

## Licence

These files are part of Python Lab: MIT code. Do not add a third-party search library when you copy the folder.
