# Short alias `/python-lab/` (PR0 decision pending)

`https://cyphermonkeylabs.com/python-lab/` returns 404 today. This repo's GitHub Pages site is served under `/python-lab-free-university-mesmerizing/`, so **this repo cannot create a page at `/python-lab/`**. That path belongs to the parent site that serves cyphermonkeylabs.com.

`alias/python-lab/index.html` is a ready redirect page (meta refresh + canonical, `noindex`). It is **not deployed**. To use it, Lucky answers PR0 (keep long path only, or add alias), then the file is copied to `python-lab/index.html` in the repo that serves the apex domain. Until then it is structural only and nothing links to it.
