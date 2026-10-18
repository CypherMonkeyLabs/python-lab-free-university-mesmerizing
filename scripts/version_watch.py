#!/usr/bin/env python3
"""Version watch: compare what the lab says about Python releases with python.org.

  python3 scripts/version_watch.py            # network; exit 1 on mismatch
  python3 scripts/version_watch.py --offline  # only parse the lab's claims, no network

Reads the claim from js/content/start.js ("newest stable CPython release ... is X.Y.Z, released D Month YYYY").
Fetches the python.org release API (latest stable, https://www.python.org/api/v2/downloads/release/) and https://peps.python.org/pep-0790/ (schedule).
Never edits content: it prints a report and exits non-zero so CI can open an issue.
"""
import pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
claim_src = (ROOT / "js/content/start.js").read_text()
m = re.search(r"newest stable CPython release on python\.org is (\d+\.\d+\.\d+), released (\d+ \w+ \d{4})", claim_src)
if not m:
    print("FAIL could not find the release claim in js/content/start.js")
    sys.exit(1)
claim_ver, claim_date = m.group(1), m.group(2)
print(f"lab claims: Python {claim_ver} released {claim_date}")
rt = re.search(r"Pyodide ([\d.]+) runs CPython ([\d.]+)", (ROOT / "js/content/start.js").read_text())
if rt:
    print(f"lab runtime claim: Pyodide {rt.group(1)} / CPython {rt.group(2)}")
if "--offline" in sys.argv:
    sys.exit(0)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "python-lab-version-watch/1 (+https://github.com/CypherMonkeyLabs/python-lab-free-university-mesmerizing)"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


bad = []
try:
    import json
    rel = json.loads(get("https://www.python.org/api/v2/downloads/release/?is_published=true"))
    stable = sorted((r for r in rel if r["version"] == 3 and not r["pre_release"]), key=lambda r: r["release_date"])
    flagged = [r for r in stable if r.get("is_latest")]
    top = (flagged or stable)[-1]
    latest_ver = top["name"].replace("Python ", "")
    latest_day = top["release_date"][:10]
    print("python.org latest:", latest_ver, latest_day)
    if latest_ver != claim_ver:
        bad.append(f"latest on python.org is {latest_ver}, lab says {claim_ver}")
    else:
        import datetime
        want = datetime.datetime.strptime(claim_date, "%d %B %Y").date().isoformat()
        if want != latest_day:
            bad.append(f"python.org release date {latest_day}, lab says {want}")
    pep = get("https://peps.python.org/pep-0790/")
    txt = re.sub(r"<[^>]+>", " ", pep)
    row = re.search(r"3\.15\.0 final:?\s*(?:[A-Za-z]+,\s*)?(\d{4}-\d{2}-\d{2})", txt)
    if row:
        print("PEP 790 3.15.0 final date:", row.group(1))
        import datetime
        d = datetime.datetime.strptime(claim_date, "%d %B %Y").date().isoformat()
        if d != row.group(1):
            bad.append(f"PEP 790 schedules 3.15.0 final on {row.group(1)}, lab says {d} (a release may slip: check the python.org release page before editing)")
    else:
        print("note: PEP 790 final date not parsed (page layout changed or release already moved); not a failure")
except Exception as e:  # network errors are reported, not hidden
    print("FAIL network error:", e)
    sys.exit(2)
for b in bad:
    print("MISMATCH", b)
print("version_watch:", "OK" if not bad else f"{len(bad)} mismatch(es)")
sys.exit(1 if bad else 0)
