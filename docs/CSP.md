# Content Security Policy check (PR1)

Run `python3 scripts/csp_check.py`. It scans `index.html`, `404.html`, `css/` and `js/` for anything *loaded* from another origin (script/img/iframe src, stylesheet links, `url()`, `@import`, `import`, `fetch`, workers). Result on this branch: **0 off-origin loads**; the lab already keeps to its "no CDN" rule.

It also prints a suggested policy for review. Findings:
- `index.html` has 2 inline `<script>` blocks (theme bootstrap and a small helper). A strict `script-src` needs their SHA-256 hashes (printed by the script) or moving them to files.
- Pyodide needs `'wasm-unsafe-eval'`.
- Diagram pages in `diagrams/` are separate same-origin HTML documents with their own inline code; they need `frame-src 'self'` and their own policy if a header or meta CSP is ever applied to them.
- GitHub Pages cannot set response headers, so a CSP would be a `<meta http-equiv>` tag. Meta CSP cannot set `frame-ancestors`.

**Not done:** no CSP is enforced. Adding a meta CSP could break the diagrams, bot or runner and needs a full matrix run first. Left for Lucky's decision.
