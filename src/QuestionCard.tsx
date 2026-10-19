import { imgUrl, type Lang, type Question } from './data'
import type { Strings } from './i18n'

const REPO = 'antonpaisov/codigo-pt'
const LETTERS = 'abcd'

interface Props {
  q: Question
  lang: Lang | 'none'
  t: Strings
  selected: number | null
  /** reveal = show correct/wrong colouring and the explanation */
  reveal: boolean
  onSelect?: (i: number) => void
}

function reportUrl(q: Question) {
  const body = `Question \`${q.id}\`\n\n> ${q.pt.q}\n\n${q.pt.o
    .map((o, i) => `${LETTERS[i]}) ${o}${i === q.ans ? '  ← app answer' : ''}`)
    .join('\n')}\n\nWhat's wrong:\n`
  return `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(`Wrong answer: ${q.id}`)}&body=${encodeURIComponent(body)}`
}

function Bi({ pt, tr, className }: { pt: string; tr?: string; className?: string }) {
  return (
    <div className={`bi ${tr ? 'has-tr' : ''} ${className ?? ''}`}>
      <span className="pt" lang="pt">{pt}</span>
      {tr && <span className="tr">{tr}</span>}
    </div>
  )
}

export default function QuestionCard({ q, lang, t, selected, reveal, onSelect }: Props) {
  const tr = lang === 'none' ? null : q[lang]
  const img = imgUrl(q)
  return (
    <div className="card">
      {img && <img className="qimg" src={img} alt="" />}
      <Bi className="question" pt={q.pt.q} tr={tr?.q} />
      <div className="options">
        {q.pt.o.map((o, i) => {
          let state = ''
          if (reveal && i === q.ans) state = 'correct'
          else if (reveal && i === selected) state = 'wrong'
          else if (!reveal && i === selected) state = 'selected'
          return (
            <button
              key={i}
              className={`option ${state}`}
              disabled={!onSelect}
              onClick={() => onSelect?.(i)}
            >
              <span className="letter">{LETTERS[i]}</span>
              <Bi pt={o} tr={tr?.o[i]} />
            </button>
          )
        })}
      </div>
      {reveal && (
        <div className="explain">
          {selected !== null && (
            <p className={selected === q.ans ? 'ok' : 'bad'}>
              {selected === q.ans ? t.right : `${t.wrong} ${LETTERS[q.ans]})`}
            </p>
          )}
          {tr && <p>{tr.x}</p>}
          {!tr && <p>{q.en.x}</p>}
          {q.conf === 'low' && <p className="warn">⚠️ {t.lowConf}</p>}
          <a className="report" href={reportUrl(q)} target="_blank" rel="noreferrer">
            {t.report}
          </a>
        </div>
      )}
    </div>
  )
}
