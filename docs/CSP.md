# Content Security Policy

GitHub Pages cannot set response headers, so every HTML page carries a
`<meta http-equiv="Content-Security-Policy">` tag. Meta CSP cannot set
`frame-ancestors`.

Shared policy:

`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'`

`index.html` is the only page that starts Pyodide. Its `script-src` also allows
`'wasm-unsafe-eval'` and `'unsafe-eval'`, and its `connect-src` also allows
`blob:`.

- `'wasm-unsafe-eval'` lets the page compile `pyodide.asm.wasm`.
- `'unsafe-eval'` is required as well. Pyodide's Emscripten glue calls `eval` while building EM_JS and EM_ASM wrappers at startup. `wasm-unsafe-eval` does not cover that `eval`. The file is vendored and is not edited.
- `worker-src 'self' blob:` covers the service worker and any blob worker the runtime opens.
- `connect-src 'self' blob:` covers fetches of the local wasm file and blob URLs the runtime opens.
- `img-src` and `media-src` allow `blob:` and `data:` because the diagram viewer and the runtime build images and audio from memory.

Executable inline scripts were moved to `js/theme-boot.js`, `js/sw-register.js`, `diagrams/archify-theme.js`, and `diagrams/archify-viewer.js`. `type="application/json"` blocks in the diagram pages stay inline; they are data, not scripts. No page uses `script-src 'unsafe-inline'`.

Run `python3 scripts/csp_check.py`. It fails if a page is missing the meta tag, still has an executable inline script, or loads a resource from another origin.
