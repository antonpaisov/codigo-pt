"""Merge extracted PT questions with AI output into the app's data file.

Usage: python3 pipeline/merge.py   -> public/data/questions.json
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

pt = json.loads((ROOT / "data/questions_pt.json").read_text())
ai = {}
for p in sorted((ROOT / "data/ai").glob("c*.json")):
    for o in json.loads(p.read_text()):
        ai[o["id"]] = o

out = []
for q in pt:
    o = ai.get(q["id"])
    if not o:
        continue
    out.append({
        "id": q["id"],
        "img": q["image"],
        "cats": o["categories"],
        "topic": o["topic"],
        "ans": [x["key"] for x in q["options"]].index(o["answer"]),
        "conf": o["confidence"],
        "pt": {"q": q["pt"], "o": [x["pt"] for x in q["options"]]},
        "en": {"q": o["en"]["q"], "o": o["en"]["options"], "x": o["en"]["explanation"]},
        "uk": {"q": o["uk"]["q"], "o": o["uk"]["options"], "x": o["uk"]["explanation"]},
    })
    keys = [x["key"] for x in q["options"]]
    if o.get("why_wrong"):
        # index-aligned with options; null for the correct one / missing notes
        for lang in ("en", "uk"):
            out[-1][lang]["w"] = [(o["why_wrong"].get(k) or {}).get(lang) for k in keys]

dest = ROOT / "public/data/questions.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(f"{len(out)}/{len(pt)} questions written to {dest.relative_to(ROOT)}")
