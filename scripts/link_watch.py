#!/usr/bin/env python3
"""Link watch: HTTP-check every source URL in js/content/sources.js.

  python3 scripts/link_watch.py [--json out.json]

Exit 1 if any link answers 4xx/5xx or fails. 403/429 from a site that blocks bots are reported as
"blocked" (warning, not failure) because they say nothing about the page. Never edits content.
"""
import concurrent.futures as cf, json, pathlib, re, sys, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
src = (ROOT / "js/content/sources.js").read_text()
items = re.findall(r'\{ id: "([^"]+)".*?url: "([^"]+)"', src)
UA = {"User-Agent": "Mozilla/5.0 (python-lab-link-watch/1)"}


def check(item):
    sid, url = item
    last = None
    for method in ("HEAD", "GET"):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA, method=method), timeout=25)
            return sid, url, r.status, "ok"
        except urllib.error.HTTPError as e:
            last = e.code
            if method == "HEAD":
                continue
        except Exception as e:
            last = str(e)[:80]
            if method == "HEAD":
                continue
    if last in (403, 429):
        return sid, url, last, "blocked"
    return sid, url, last, "fail"


with cf.ThreadPoolExecutor(8) as ex:
    res = list(ex.map(check, items))
for sid, url, code, st in res:
    if st != "ok":
        print(st.upper(), sid, code, url)
n = {k: sum(1 for r in res if r[3] == k) for k in ("ok", "blocked", "fail")}
print("link_watch:", len(res), "links", n)
if "--json" in sys.argv:
    pathlib.Path(sys.argv[sys.argv.index("--json") + 1]).write_text(json.dumps(res, indent=1))
sys.exit(1 if n["fail"] else 0)
