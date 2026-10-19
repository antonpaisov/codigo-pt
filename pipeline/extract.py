"""Extract questions + images from the official IMT question PDFs.

Usage: python pipeline/extract.py data/raw public/img data/questions_pt.json
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

TEXT_X = 190  # question text column starts right of this; images live left of it
OPT_RE = re.compile(r"^([a-d])\)\s*$")


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def page_lines(page):
    out = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            text = "".join(s["text"] for s in l["spans"])
            if not text.strip():
                continue
            x0, y0, x1, y1 = l["bbox"]
            if x0 < TEXT_X or y0 > 780:  # skip footer / left column
                continue
            bold = bool(l["spans"][0]["flags"] & 16)
            out.append({"x": x0, "y": y0, "text": text, "bold": bold})
    out.sort(key=lambda l: (round(l["y"]), l["x"]))
    return out


def parse_page(page):
    """Return list of (y_top, question_text, [options])."""
    qs = []
    cur = None
    opt = None
    for l in page_lines(page):
        t = l["text"]
        m = OPT_RE.match(t.strip())
        if m:
            opt = {"key": m.group(1), "text": ""}
            cur["options"].append(opt)
            continue
        if l["bold"] and l["x"] < 215 and (cur is None or cur["options"]):
            cur = {"y": l["y"], "q": t, "options": []}
            opt = None
            qs.append(cur)
            continue
        if opt is not None and l["x"] >= 215:
            opt["text"] += " " + t
        elif cur is not None and not cur["options"]:
            cur["q"] += " " + t
        elif opt is not None:  # option text on same line as "a)" marker
            opt["text"] += " " + t
    return qs


def main(raw_dir, img_dir, out_json):
    raw_dir, img_dir = Path(raw_dir), Path(img_dir)
    img_dir.mkdir(parents=True, exist_ok=True)
    questions = []
    warnings = 0
    for group in range(1, 15):
        doc = pymupdf.open(raw_dir / f"rel_{group}.pdf")
        n = 0
        for pno, page in enumerate(doc):
            qs = parse_page(page)
            imgs = [i["bbox"] for i in page.get_image_info() if i["bbox"][2] < TEXT_X and i["bbox"][1] > 60]
            for k, q in enumerate(qs):
                top = q["y"] - 6
                bottom = qs[k + 1]["y"] - 6 if k + 1 < len(qs) else 790
                band = [b for b in imgs if top <= b[1] < bottom]
                n += 1
                qid = f"g{group:02d}-{n:04d}"
                image = None
                if band:
                    rect = pymupdf.Rect(
                        min(b[0] for b in band), min(b[1] for b in band),
                        max(b[2] for b in band), max(b[3] for b in band),
                    )
                    pix = page.get_pixmap(clip=rect, dpi=150)
                    image = f"{qid}.jpg"
                    pix.save(img_dir / image, jpg_quality=72)
                opts = [{"key": o["key"], "pt": clean(o["text"])} for o in q["options"]]
                if len(opts) < 2 or any(not o["pt"] for o in opts):
                    warnings += 1
                    print(f"WARN {qid} p{pno + 1}: {clean(q['q'])[:70]} opts={opts}", file=sys.stderr)
                questions.append({
                    "id": qid, "group": group, "page": pno + 1,
                    "pt": clean(q["q"]), "options": opts, "image": image,
                })
        print(f"group {group}: {n} questions", file=sys.stderr)
    Path(out_json).write_text(json.dumps(questions, ensure_ascii=False, indent=1))
    print(f"total {len(questions)}, warnings {warnings}", file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:4])
