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
  en: { q: string; o: string[]; x: string }
  uk: { q: string; o: string[]; x: string }
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
