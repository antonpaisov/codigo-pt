import { useCallback, useState } from 'react'
import type { Category, Lang } from './data'

export interface Settings {
  category: Category
  lang: Lang | 'none'
  examSize: number
  examMaxErrors: number
  examMinutes: number
}

export const DEFAULT_SETTINGS: Settings = {
  category: 'A',
  lang: 'en',
  examSize: 30,
  examMaxErrors: 3,
  examMinutes: 30,
}

/** Per-question history: counts plus whether the most recent attempt was wrong. */
export interface Record_ {
  right: number
  wrong: number
  lastWrong: boolean
}
export type Progress = Record<string, Record_>

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? { ...fallback, ...JSON.parse(v) } : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode) — progress just isn't saved */
  }
}

export function useSettings() {
  const [settings, setState] = useState<Settings>(() => read('settings', DEFAULT_SETTINGS))
  const update = useCallback((patch: Partial<Settings>) => {
    setState((s) => {
      const next = { ...s, ...patch }
      write('settings', next)
      return next
    })
  }, [])
  return [settings, update] as const
}

export function useProgress() {
  const [progress, setState] = useState<Progress>(() => read('progress', {}))
  const record = useCallback((id: string, correct: boolean) => {
    setState((p) => {
      const r = p[id] ?? { right: 0, wrong: 0, lastWrong: false }
      const next = {
        ...p,
        [id]: { right: r.right + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1), lastWrong: !correct },
      }
      write('progress', next)
      return next
    })
  }, [])
  const reset = useCallback(() => {
    write('progress', {})
    setState({})
  }, [])
  return { progress, record, reset }
}
