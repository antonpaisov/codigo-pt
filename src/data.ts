export type Lang = 'en' | 'uk'
export type Category = 'AM' | 'A' | 'B' | 'C' | 'D'

export interface Question {
  id: string
  img: string | null
  cats: Category[]
  topic: string
  ans: number
  conf: 'high' | 'medium' | 'low'
  pt: { q: string; o: string[] }
  /** w: per-option note on why that (wrong) option is wrong; only for 3+ option questions */
  en: { q: string; o: string[]; x: string; w?: (string | null)[] }
  uk: { q: string; o: string[]; x: string; w?: (string | null)[] }
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'A', label: 'A · Motociclos' },
  { id: 'AM', label: 'AM · Ciclomotores' },
  { id: 'B', label: 'B · Ligeiros' },
  { id: 'C', label: 'C · Pesados mercadorias' },
  { id: 'D', label: 'D · Pesados passageiros' },
]

export const TOPICS: Record<string, { pt: string; en: string; uk: string }> = {
  signs: { pt: 'Sinalização', en: 'Signs & markings', uk: 'Знаки та розмітка' },
  priority: { pt: 'Prioridade', en: 'Right of way', uk: 'Пріоритет проїзду' },
  speed: { pt: 'Velocidade', en: 'Speed', uk: 'Швидкість' },
  manoeuvres: { pt: 'Manobras', en: 'Manoeuvres & overtaking', uk: 'Маневри та обгін' },
  stopping_parking: { pt: 'Paragem e estacionamento', en: 'Stopping & parking', uk: 'Зупинка та стоянка' },
  lights: { pt: 'Luzes e visibilidade', en: 'Lights & visibility', uk: 'Світло та видимість' },
  driver: { pt: 'O condutor', en: 'Driver (alcohol, fatigue…)', uk: 'Водій (алкоголь, втома…)' },
  safe_driving: { pt: 'Condução segura', en: 'Safe driving', uk: 'Безпечне керування' },
  vehicle: { pt: 'Veículo', en: 'Vehicle & mechanics', uk: 'Транспортний засіб' },
  passengers_cargo: { pt: 'Passageiros e carga', en: 'Passengers & cargo', uk: 'Пасажири та вантаж' },
  legal: { pt: 'Legislação', en: 'Law, documents, fines', uk: 'Закон, документи, штрафи' },
  accidents: { pt: 'Acidentes e avarias', en: 'Accidents & breakdowns', uk: 'ДТП та несправності' },
  environment: { pt: 'Ambiente', en: 'Eco-driving', uk: 'Екологічне водіння' },
}

/** A question is "general" when it applies to every category (common rules). */
export const isGeneral = (q: Question) => q.cats.length === CATEGORIES.length

export interface ExamPreset {
  id: string
  label: { en: string; uk: string }
  specific: number
  general: number
  maxErrors: number
  minutes: number
}

/** Official formats per Regulamento da Habilitação Legal para Conduzir, art. 43. */
export const EXAM_PRESETS: Partial<Record<Category, ExamPreset[]>> = {
  A: [
    {
      id: 'A-holder-B',
      label: { en: 'I already have a B licence', uk: 'Вже маю права категорії B' },
      specific: 10, general: 0, maxErrors: 1, minutes: 10,
    },
    {
      id: 'A-full',
      label: { en: 'Full exam (no licence yet)', uk: 'Повний іспит (без прав)' },
      specific: 10, general: 30, maxErrors: 4, minutes: 40,
    },
  ],
}

/**
 * Pick n questions spread across topics in proportion to each topic's share of the
 * pool (largest-remainder rounding), so an exam covers the syllabus like the real one.
 * Low-confidence answers are left out of exams.
 */
export function sampleExam(pool: Question[], n: number): Question[] {
  const usable = pool.filter((q) => q.conf !== 'low')
  const byTopic = new Map<string, Question[]>()
  for (const q of shuffle(usable)) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q])
  const total = usable.length
  const take = Math.min(n, total)
  const alloc = [...byTopic].map(([topic, qs]) => {
    const exact = (take * qs.length) / total
    return { topic, qs, k: Math.floor(exact), rest: exact - Math.floor(exact) }
  })
  let left = take - alloc.reduce((s, a) => s + a.k, 0)
  for (const a of shuffle(alloc).sort((x, y) => y.rest - x.rest)) {
    if (left === 0) break
    a.k++
    left--
  }
  return alloc.flatMap((a) => a.qs.slice(0, a.k))
}

export async function loadQuestions(): Promise<Question[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/questions.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function imgUrl(q: Question) {
  return q.img ? `${import.meta.env.BASE_URL}img/${q.img}` : null
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
