# Vendored three.js subset

- Upstream: https://github.com/mrdoob/three.js, release r186 (npm `three@0.186.1`), MIT licence, text in `LICENSE`.
- Library-first source: libsearch id `cm-01623` (checked 2026-10-17).
- File `three.subset.min.js` is a tree-shaken bundle of only the classes listed in `subset.js` (no loaders, no post-processing, no WebGPU).
- Rebuild: `npm i three@0.186.1 esbuild && npx esbuild subset.js --bundle --minify --format=esm --legal-comments=none --outfile=three.subset.min.js`, then prepend the one-line banner.
- Loaded lazily (`import()`) only on routes that show a 3D scene. No CDN.
