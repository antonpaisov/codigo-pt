# Re-check pass for low-confidence questions

The first pass judged images from low-resolution crops; `public/img/` now has
sharp, full-resolution images. Re-examine the questions listed in
`data/recheck/<batch>.json` (an array of ids).

For each id:
1. Read the source question from `data/questions_pt.json` and the current AI output
   from `data/ai/c*.json` (find it by id).
2. Look at the image `public/img/<id>.jpg` (always — that is the point of this pass).
3. Decide the answer again following `pipeline/AGENT_INSTRUCTIONS.md` (same rules,
   same output object format, including `why_wrong` for 3+ option questions).
   Raise confidence only if the sharper image (or a second careful look) genuinely
   settles it; keep "low" if the question is still ambiguous or the official options
   look wrong — and then say so in the explanation.

Write a JSON array with one complete output object per id to
`data/ai/recheck_<batch>.json` (these override the first-pass objects at merge time).
Validate with `python3 pipeline/validate.py --recheck <batch>` and fix any errors.
Reply with: how many ids, how many changed answer, how many are still low.
