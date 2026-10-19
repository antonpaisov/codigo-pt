"""Validate an AI output chunk against its input chunk.

Usage: python3 pipeline/validate.py c001        (one chunk)
       python3 pipeline/validate.py --all       (every chunk; lists missing ones)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATS = {"AM", "A", "B", "C", "D"}
TOPICS = {"signs", "priority", "speed", "manoeuvres", "stopping_parking", "lights", "driver",
          "safe_driving", "vehicle", "passengers_cargo", "legal", "accidents", "environment"}


def validate(chunk):
    src = json.loads((ROOT / "data/chunks" / f"{chunk}.json").read_text())
    out_path = ROOT / "data/ai" / f"{chunk}.json"
    if not out_path.exists():
        return [f"{chunk}: output missing"]
    try:
        out = json.loads(out_path.read_text())
    except json.JSONDecodeError as e:
        return [f"{chunk}: invalid JSON: {e}"]
    errs = []
    by_id = {o.get("id"): o for o in out}
    for q in src:
        o = by_id.get(q["id"])
        if o is None:
            errs.append(f"{q['id']}: missing")
            continue
        keys = [x["key"] for x in q["options"]]
        if o.get("answer") not in keys:
            errs.append(f"{q['id']}: answer {o.get('answer')!r} not in {keys}")
        if o.get("confidence") not in ("high", "medium", "low"):
            errs.append(f"{q['id']}: bad confidence")
        cats = o.get("categories") or []
        if not cats or not set(cats) <= CATS:
            errs.append(f"{q['id']}: bad categories {cats}")
        if o.get("topic") not in TOPICS:
            errs.append(f"{q['id']}: bad topic {o.get('topic')!r}")
        for lang in ("en", "uk"):
            t = o.get(lang) or {}
            if not t.get("q") or not t.get("explanation"):
                errs.append(f"{q['id']}: {lang} missing q/explanation")
            if len(t.get("options") or []) != len(keys):
                errs.append(f"{q['id']}: {lang} has {len(t.get('options') or [])} options, expected {len(keys)}")
    extra = set(by_id) - {q["id"] for q in src}
    if extra:
        errs.append(f"{chunk}: unexpected ids {sorted(extra)}")
    return errs


def main():
    if sys.argv[1] == "--all":
        chunks = sorted(p.stem for p in (ROOT / "data/chunks").glob("*.json"))
        bad = [c for c in chunks if validate(c)]
        print(f"{len(chunks) - len(bad)}/{len(chunks)} chunks valid; not valid: {' '.join(bad) or '-'}")
        return
    errs = validate(sys.argv[1])
    for e in errs[:40]:
        print(e)
    print(f"{sys.argv[1]}: {'OK' if not errs else f'{len(errs)} errors'}")


if __name__ == "__main__":
    main()
