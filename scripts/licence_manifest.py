#!/usr/bin/env python3
"""Check that every vendored/third-party file is listed in THIRD_PARTY_MANIFEST.json
with the right SHA-256, and that THIRD_PARTY_NOTICES.md has no unresolved "verify".

  python3 scripts/licence_manifest.py          # check (exit 1 on any problem)
  python3 scripts/licence_manifest.py --write  # rewrite hashes for files already listed
"""
import hashlib, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAN = ROOT / "THIRD_PARTY_MANIFEST.json"
SCAN = ["vendor", "assets/fonts"]


def sha(p):
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()


def main():
    data = json.loads(MAN.read_text())
    files = {f["path"]: f for c in data["components"] for f in c["files"]}
    problems = []
    if "--write" in sys.argv:
        for path, f in files.items():
            f["sha256"] = sha(ROOT / path)
        MAN.write_text(json.dumps(data, indent=2) + "\n")
        print("rewrote", MAN)
        return 0
    for path, f in files.items():
        p = ROOT / path
        if not p.is_file():
            problems.append(f"listed but missing: {path}")
        elif sha(p) != f["sha256"]:
            problems.append(f"hash mismatch: {path}")
    for d in SCAN:
        for p in sorted((ROOT / d).rglob("*")):
            if p.is_file() and p.relative_to(ROOT).as_posix() not in files:
                problems.append(f"vendored file not in manifest: {p.relative_to(ROOT)}")
    for c in data["components"]:
        for k in ("name", "version", "licence", "url", "licence_file"):
            if not c.get(k):
                problems.append(f"{c.get('name')}: missing {k}")
        if c.get("licence_file") and not c["licence_file"].startswith("(") and not (ROOT / c["licence_file"]).is_file():
            problems.append(f"{c['name']}: licence file missing {c['licence_file']}")
    notices = (ROOT / "THIRD_PARTY_NOTICES.md").read_text()
    if re.search(r"\bverify\b", notices, re.I):
        problems.append("THIRD_PARTY_NOTICES.md still contains 'verify'")
    for pr in problems:
        print("FAIL", pr)
    print("manifest:", len(files), "files,", len(data["components"]), "components,", len(problems), "problems")
    return 1 if problems else 0


sys.exit(main())
