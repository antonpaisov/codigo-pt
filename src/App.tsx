import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, EXAM_PRESETS, TOPICS, isGeneral, loadQuestions, shuffle, type Question } from './data'
import { strings, type Strings } from './i18n'
import QuestionCard from './QuestionCard'
import { useProgress, useSettings, type Progress, type Settings } from './store'

type Screen =
  | { kind: 'home' }
  | { kind: 'practice'; title: string; pool: Question[] }
  | { kind: 'exam'; pool: Question[]; maxErrors: number; minutes: number }

export default function App() {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, updateSettings] = useSettings()
  const { progress, record, reset } = useProgress()
  const [screen, setScreen] = useState<Screen>({ kind: 'home' })
  const t = strings(settings.lang)

  useEffect(() => {
    loadQuestions().then(setQuestions, (e) => setError(String(e)))
  }, [])

  const inCategory = useMemo(
    () => (questions ?? []).filter((q) => q.cats.includes(settings.category)),
    [questions, settings.category],
  )

  if (error) return <main className="center">⚠️ {error}</main>
  if (!questions) return <main className="center">{t.loading}</main>

  const home = () => setScreen({ kind: 'home' })
  const setLang = (lang: Settings['lang']) => updateSettings({ lang })

  if (screen.kind === 'practice')
    return <Practice key={screen.title} title={screen.title} pool={screen.pool} settings={settings} setLang={setLang} t={t} record={record} onExit={home} />
  if (screen.kind === 'exam')
    return <Exam pool={screen.pool} maxErrors={screen.maxErrors} minutes={screen.minutes} settings={settings} setLang={setLang} t={t} record={record} onExit={home} />

  return (
    <Home
      t={t}
      settings={settings}
      updateSettings={updateSettings}
      progress={progress}
      resetProgress={reset}
      inCategory={inCategory}
      start={setScreen}
    />
  )
}

function Home({
  t, settings, updateSettings, progress, resetProgress, inCategory, start,
}: {
  t: Strings
  settings: Settings
  updateSettings: (p: Partial<Settings>) => void
  progress: Progress
  resetProgress: () => void
  inCategory: Question[]
  start: (s: Screen) => void
}) {
  const topicName = (id: string) => (settings.lang === 'none' ? TOPICS[id]?.pt : TOPICS[id]?.[settings.lang]) ?? id
  const mistakes = inCategory.filter((q) => progress[q.id]?.lastWrong)
  const specific = inCategory.filter((q) => !isGeneral(q))
  const general = inCategory.filter(isGeneral)
  const presets = EXAM_PRESETS[settings.category] ?? []
  const preset = presets.find((p) => p.id === settings.examPreset)
  const exam = preset
    ? { size: preset.specific + preset.general, maxErrors: preset.maxErrors, minutes: preset.minutes }
    : { size: settings.examSize, maxErrors: settings.examMaxErrors, minutes: settings.examMinutes }
  const startExam = () =>
    start({
      kind: 'exam',
      maxErrors: exam.maxErrors,
      minutes: exam.minutes,
      pool: preset
        ? shuffle([...shuffle(general).slice(0, preset.general), ...shuffle(specific).slice(0, preset.specific)])
        : shuffle(inCategory).slice(0, exam.size),
    })
  const lang = settings.lang === 'uk' ? 'uk' : 'en'
  const answered = inCategory.filter((q) => progress[q.id])
  const correctNow = answered.filter((q) => !progress[q.id].lastWrong)

  const byTopic = Object.keys(TOPICS)
    .map((id) => {
      const qs = inCategory.filter((q) => q.topic === id)
      const done = qs.filter((q) => progress[q.id])
      const ok = done.filter((q) => !progress[q.id].lastWrong)
      return { id, qs, done: done.length, pct: done.length ? Math.round((100 * ok.length) / done.length) : null }
    })
    .filter((x) => x.qs.length)

  return (
    <main>
      <header className="top">
        <h1>🏍️ {t.title}</h1>
        <LangSwitch lang={settings.lang} setLang={(lang) => updateSettings({ lang })} />
      </header>

      <section className="panel settings-row">
        <label>
          {t.category}
          <select value={settings.category} onChange={(e) => updateSettings({ category: e.target.value as Settings['category'] })}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel stats">
        <div><b>{inCategory.length}</b><span>{t.questions}</span></div>
        <div><b>{answered.length}</b><span>{t.answered}</span></div>
        <div><b>{answered.length ? Math.round((100 * correctNow.length) / answered.length) : 0}%</b><span>{t.correct}</span></div>
      </section>

      <section className="actions">
        {presets.length > 0 && (
          <select className="preset" value={preset?.id ?? 'custom'} onChange={(e) => updateSettings({ examPreset: e.target.value })}>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label[lang]} — {p.specific + p.general} · ≤{p.maxErrors} {t.errors}
              </option>
            ))}
            <option value="custom">{t.custom}</option>
          </select>
        )}
        <button className="primary" onClick={startExam}>
          📝 {t.exam} <small>{exam.size} · ≤{exam.maxErrors} {t.errors} · {exam.minutes} min</small>
        </button>
        <button onClick={() => start({ kind: 'practice', title: t.practiceAll, pool: unseenFirst(inCategory, progress) })}>
          🎯 {t.practiceAll}
        </button>
        {specific.length > 0 && specific.length < inCategory.length && (
          <button onClick={() => start({ kind: 'practice', title: t.specificOnly, pool: unseenFirst(specific, progress) })}>
            🏍️ {t.specificOnly} <small>{specific.length} {t.questions}</small>
          </button>
        )}
        <button disabled={!mistakes.length} onClick={() => start({ kind: 'practice', title: t.mistakes, pool: shuffle(mistakes) })}>
          🔁 {t.mistakes} <small>{mistakes.length || t.noMistakes}</small>
        </button>
      </section>

      <h2>{t.topics}</h2>
      <section className="topics">
        {byTopic.map((x) => (
          <button key={x.id} onClick={() => start({ kind: 'practice', title: topicName(x.id), pool: unseenFirst(x.qs, progress) })}>
            <span>{topicName(x.id)}</span>
            <small>
              {x.done}/{x.qs.length}
              {x.pct !== null && ` · ${x.pct}%`}
            </small>
            <div className="bar"><div style={{ width: `${(100 * x.done) / x.qs.length}%` }} /></div>
          </button>
        ))}
      </section>

      <details className="panel">
        <summary>{t.settings}</summary>
        <div className="settings-row">
          <NumberInput label={t.examSize} value={settings.examSize} min={5} max={100} onChange={(v) => updateSettings({ examSize: v })} />
          <NumberInput label={t.examMaxErrors} value={settings.examMaxErrors} min={0} max={50} onChange={(v) => updateSettings({ examMaxErrors: v })} />
          <NumberInput label={t.examMinutes} value={settings.examMinutes} min={1} max={120} onChange={(v) => updateSettings({ examMinutes: v })} />
        </div>
        <button className="danger" onClick={() => confirmReset(resetProgress)}>{t.resetProgress}</button>
      </details>

      <p className="disclaimer">{t.disclaimer}</p>
    </main>
  )
}

function confirmReset(reset: () => void) {
  if (window.confirm('Reset all progress?')) reset()
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label>
      {label}
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v >= min && v <= max) onChange(v)
        }}
      />
    </label>
  )
}

/** Unanswered questions first (shuffled), then previously wrong, then the rest. */
function unseenFirst(qs: Question[], progress: Progress) {
  const rank = (q: Question) => (!progress[q.id] ? 0 : progress[q.id].lastWrong ? 1 : 2)
  return shuffle(qs).sort((a, b) => rank(a) - rank(b))
}

const LANGS: { id: Settings['lang']; label: string }[] = [
  { id: 'none', label: 'PT' },
  { id: 'en', label: 'EN' },
  { id: 'uk', label: 'UK' },
]

/** PT = Portuguese only; EN / UK = Portuguese with that translation alongside. */
function LangSwitch({ lang, setLang }: { lang: Settings['lang']; setLang: (l: Settings['lang']) => void }) {
  return (
    <div className="lang-switch" role="group" aria-label="Translation">
      {LANGS.map((l) => (
        <button key={l.id} className={lang === l.id ? 'on' : ''} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

function TopBar({ title, onExit, t, lang, setLang, children }: {
  title: string
  onExit: () => void
  t: Strings
  lang: Settings['lang']
  setLang: (l: Settings['lang']) => void
  children?: React.ReactNode
}) {
  return (
    <header className="top bar-top">
      <button className="ghost" onClick={onExit}>← {t.home}</button>
      <span className="title">{title}</span>
      {children}
      <LangSwitch lang={lang} setLang={setLang} />
    </header>
  )
}

function Practice({ title, pool, settings, setLang, t, record, onExit }: {
  title: string
  pool: Question[]
  settings: Settings
  setLang: (l: Settings['lang']) => void
  t: Strings
  record: (id: string, ok: boolean) => void
  onExit: () => void
}) {
  const [i, setI] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState({ right: 0, wrong: 0 })
  const q = pool[i]

  if (!q) return <main className="center"><p>{t.noMistakes}</p><button onClick={onExit}>{t.home}</button></main>

  const answer = (k: number) => {
    if (selected !== null) return
    setSelected(k)
    const ok = k === q.ans
    record(q.id, ok)
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }))
  }
  const next = () => {
    setSelected(null)
    setI((x) => x + 1)
    window.scrollTo(0, 0)
  }

  return (
    <main>
      <TopBar title={title} onExit={onExit} t={t} lang={settings.lang} setLang={setLang}>
        <span className="score">✅ {score.right} ❌ {score.wrong} · {i + 1}/{pool.length}</span>
      </TopBar>
      <QuestionCard q={q} lang={settings.lang} t={t} selected={selected} reveal={selected !== null} onSelect={answer} />
      {selected !== null && i + 1 < pool.length && (
        <button className="primary next" onClick={next}>{t.next} →</button>
      )}
      {selected !== null && i + 1 >= pool.length && (
        <button className="primary next" onClick={onExit}>{t.home}</button>
      )}
    </main>
  )
}

function Exam({ pool, maxErrors, minutes, settings, setLang, t, record, onExit }: {
  pool: Question[]
  maxErrors: number
  minutes: number
  settings: Settings
  setLang: (l: Settings['lang']) => void
  t: Strings
  record: (id: string, ok: boolean) => void
  onExit: () => void
}) {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => pool.map(() => null))
  const [done, setDone] = useState(false)
  const [onlyMistakes, setOnlyMistakes] = useState(true)
  const [deadline] = useState(() => Date.now() + minutes * 60_000)
  const [now, setNow] = useState(() => Date.now())

  const finish = () => {
    if (done) return
    pool.forEach((q, k) => record(q.id, answers[k] === q.ans))
    setDone(true)
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    if (done) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [done])

  const left = Math.max(0, deadline - now)
  useEffect(() => {
    if (left === 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  if (done) {
    const errors = pool.filter((q, k) => answers[k] !== q.ans).length
    const passed = errors <= maxErrors
    // mistakes first, keeping exam order within each group
    const order = pool
      .map((q, k) => ({ q, k, ok: answers[k] === q.ans }))
      .sort((a, b) => Number(a.ok) - Number(b.ok))
      .filter((x) => !onlyMistakes || !x.ok)
    return (
      <main>
        <TopBar title={t.review} onExit={onExit} t={t} lang={settings.lang} setLang={setLang} />
        <section className={`panel result ${passed ? 'pass' : 'fail'}`}>
          <h2>{passed ? t.passed : t.failed}</h2>
          <p>{errors} {t.errors} ({maxErrors} {t.allowed}) · {pool.length - errors}/{pool.length}</p>
          {left === 0 && <p>{t.timeUp}</p>}
          {errors > 0 && errors < pool.length && (
            <label className="only-mistakes">
              <input type="checkbox" checked={onlyMistakes} onChange={(e) => setOnlyMistakes(e.target.checked)} /> {t.onlyMistakes}
            </label>
          )}
        </section>
        {order.map(({ q, k }) => (
          <div key={q.id} className={answers[k] === q.ans ? 'review-ok' : 'review-bad'}>
            <p className="review-num">#{k + 1} {answers[k] === null && `· ${t.unanswered}`}</p>
            <QuestionCard q={q} lang={settings.lang} t={t} selected={answers[k]} reveal />
          </div>
        ))}
        <button className="primary next" onClick={onExit}>{t.home}</button>
      </main>
    )
  }

  const q = pool[i]
  const mm = Math.floor(left / 60000)
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  return (
    <main>
      <TopBar title={`${i + 1}/${pool.length}`} onExit={onExit} t={t} lang={settings.lang} setLang={setLang}>
        <span className={`timer ${left < 60000 ? 'urgent' : ''}`}>⏱ {mm}:{ss}</span>
      </TopBar>
      <div className="dots">
        {pool.map((_, k) => (
          <button key={k} className={`dot ${k === i ? 'cur' : ''} ${answers[k] !== null ? 'done' : ''}`} onClick={() => setI(k)} aria-label={`${k + 1}`} />
        ))}
      </div>
      <QuestionCard
        q={q}
        lang={settings.lang}
        t={t}
        selected={answers[i]}
        reveal={false}
        onSelect={(k) => setAnswers((a) => a.map((v, j) => (j === i ? k : v)))}
      />
      <div className="exam-nav">
        <button disabled={i === 0} onClick={() => setI(i - 1)}>← {t.back}</button>
        {i + 1 < pool.length ? (
          <button className="primary" onClick={() => setI(i + 1)}>{t.next} →</button>
        ) : (
          <button className="primary" onClick={finish}>{t.finish}</button>
        )}
      </div>
    </main>
  )
}
