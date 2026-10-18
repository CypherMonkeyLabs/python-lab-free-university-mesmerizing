#!/usr/bin/env python3
"""Decode `_b64/**/*.b64.NNN` back into the repository tree.

This is the same join rule as `.github/workflows/restore-binaries.yml`:
parts are named `<path>.b64.001`, `.002`, ... and are concatenated in order
before base64-decoding. The Action then deletes `_b64` and commits the
binaries on `main`. This local command keeps `_b64` in place so the parts
stay the reviewable source.

    python3 pipeline/restore_binaries.py
    python3 pipeline/restore_binaries.py --check   # compare with SHA256SUMS, do not write
"""
import argparse
import base64
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def parts_for(first):
    prefix = first.name[:-3]  # drop the 001, keep the trailing dot of ".b64."
    parent = first.parent
    found = []
    for path in parent.iterdir():
        if not path.name.startswith(prefix):
            continue
        suffix = path.name[len(prefix):]
        if re.fullmatch(r"\d{3}", suffix):
            found.append(path)
    return sorted(found, key=lambda p: p.name)


def restore(check_only=False):
    sums = {}
    sum_file = ROOT / "SHA256SUMS"
    if sum_file.exists():
        for line in sum_file.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            digest, rel = line.split(None, 1)
            sums[rel] = digest
    bad = []
    count = 0
    for first in sorted((ROOT / "_b64").rglob("*.b64.001")):
        out_name = first.name[: -len(".b64.001")]
        rel_dir = first.parent.relative_to(ROOT / "_b64")
        dest = ROOT / rel_dir / out_name
        blob = b"".join(base64.b64decode(p.read_text(encoding="ascii")) for p in parts_for(first))
        rel = str(rel_dir / out_name)
        digest = hashlib.sha256(blob).hexdigest()
        if rel in sums and sums[rel] != digest:
            bad.append(rel)
        if not check_only:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(blob)
        print(f"{'checked' if check_only else 'restored'} {rel} {len(blob)} {digest[:12]}")
        count += 1
    if bad:
        print("SHA256 mismatch:", ", ".join(bad), file=sys.stderr)
        return 1
    print(f"{count} file(s)")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    sys.exit(restore(check_only=args.check))


if __name__ == "__main__":
    main()
