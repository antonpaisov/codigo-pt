# Processing instructions for question chunks

You enrich official Portuguese driving-theory exam questions (IMT, Portugal).
Input: `data/chunks/<chunk>.json` — a list of questions `{id, pt, options:[{key, pt}], image}`.
Images are at `public/img/<image>`.

For EVERY question in the chunk, produce one output object. Look at the image
(Read tool) whenever the question depends on it — signs, "Perante...", "Neste local...",
"Nesta situação...", "o veículo...", "Este sinal...", markings, positions of vehicles,
etc. If the text is fully self-contained you may skip the image.

## Output object

```json
{
  "id": "g03-0001",
  "answer": "a",
  "confidence": "high",
  "categories": ["AM", "A", "B", "C", "D"],
  "topic": "safe_driving",
  "en": { "q": "...", "options": ["...", "..."], "explanation": "..." },
  "uk": { "q": "...", "options": ["...", "..."], "explanation": "..." },
  "why_wrong": {
    "b": { "en": "...", "uk": "..." },
    "c": { "en": "...", "uk": "..." }
  }
}
```

- `answer`: key of the single correct option, according to the current Portuguese
  Código da Estrada and IMT exam conventions (the database is from ~2009–2013; if the law
  changed since, answer per CURRENT law and say so in the explanation, confidence "medium").
- `confidence`: "high" (sure), "medium" (likely), "low" (guess / ambiguous image / unclear).
  Be honest — low-confidence answers get flagged in the app.
- `categories`: licence categories whose exam this question plausibly belongs to.
  Values: "AM" (mopeds/ciclomotores), "A" (motorcycles incl. A1/A2), "B" (cars),
  "C" (heavy goods), "D" (buses). General rules (signs, priority, alcohol, safety,
  speed limits for everyone…) → all five. Car-specific → ["B","C","D"] or narrower.
  Motorcycle-specific → ["A"] (+ "AM" if it also applies to mopeds). Heavy-vehicle
  specifics (tachograph, weights, buses) → ["C"] / ["D"] / ["C","D"].
- `topic`: exactly one of:
  `signs` (signs, signals, road markings, agent signals), `priority` (right of way,
  intersections, roundabouts), `speed` (speed limits, speed control), `manoeuvres`
  (overtaking, turning, reversing, lane positioning, U-turns), `stopping_parking`,
  `lights` (lights, visibility, weather), `driver` (alcohol, drugs, fatigue, health,
  perception, reaction), `safe_driving` (distance, defensive driving, technique,
  motorcycle riding technique), `vehicle` (mechanics, maintenance, equipment, tyres),
  `passengers_cargo`, `legal` (documents, fines, licence, insurance, inspections,
  penalties), `accidents` (first aid, breakdowns, accidents), `environment` (eco-driving).
- `en` / `uk`: faithful translation of question and options (same order, same count as
  the input options, WITHOUT "a)" prefixes) into English and Ukrainian. Keep numbers,
  units and road names exact. Keep it natural but don't add info.
  `explanation`: 1–3 short sentences on why the correct answer is right (cite the rule
  or reasoning; mention the image if it matters). Ukrainian explanation = translation of
  the English one.
- `why_wrong`: ONLY for questions with 3 or more options (omit it for 2-option
  questions). One entry per WRONG option key: one short sentence saying why a
  learner who picked it is mistaken (the misconception or the rule it breaks), in
  English and Ukrainian. Don't just restate "this is not the correct answer".

## Glossary (use consistently)

| PT | EN | UK |
|---|---|---|
| cedência de passagem | give way / yield | поступитися дорогою |
| via pública | public road | дорога загального користування |
| faixa de rodagem | carriageway | проїзна частина |
| via de trânsito | lane | смуга руху |
| berma | hard shoulder | узбіччя |
| passeio | pavement / sidewalk | тротуар |
| entroncamento | T-junction | примикання доріг |
| cruzamento | crossroads | перехрестя |
| rotunda | roundabout | кільцева розв'язка |
| ultrapassagem | overtaking | обгін |
| inversão do sentido de marcha | U-turn | розворот |
| marcha atrás | reversing | рух заднім ходом |
| paragem / estacionamento | stopping / parking | зупинка / стоянка |
| auto-estrada | motorway | автомагістраль |
| via reservada a automóveis e motociclos | expressway (motor vehicles only) | дорога для автомобілів і мотоциклів |
| localidade | built-up area | населений пункт |
| ciclomotor | moped | мопед |
| motociclo | motorcycle | мотоцикл |
| velocípede | bicycle / cycle | велосипед |
| automóvel ligeiro / pesado | light / heavy vehicle | легковий / важкий автомобіль |
| peão | pedestrian | пішохід |
| passagem de peões / passadeira | pedestrian crossing | пішохідний перехід |
| sinal de perigo / proibição / obrigação | danger / prohibition / mandatory sign | попереджувальний / заборонний / наказовий знак |
| coima | fine | штраф |
| contraordenação grave / muito grave | serious / very serious offence | серйозне / дуже серйозне правопорушення |
| inibição de conduzir | driving ban | позбавлення права керування |
| taxa de álcool no sangue (TAS) | blood alcohol content (BAC) | вміст алкоголю в крові |
| condutor | driver / rider | водій |
| Certo / Errado | Correct / Incorrect | Правильно / Неправильно |

## Writing the result

Write a JSON array of output objects (same order as input, one per input id, nothing
missing) to `data/ai/<chunk>.json` with the Write tool. Then validate it:
`python3 pipeline/validate.py <chunk>` and fix anything it reports. Reply with just
the validator's last line plus the ids you marked "low".
