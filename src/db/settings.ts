import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { today } from '../logic/dates'

export interface Settings {
  /** Day 1 of the program (blocks and weeks count from here). */
  startDate: string
  stepGoal: number
  playlistUrl: string
  walkoutUrl: string
}

export const defaultSettings = (): Settings => ({
  startDate: today(),
  stepGoal: 7000,
  playlistUrl: '',
  walkoutUrl: '',
})

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<Settings>
  return { ...defaultSettings(), ...stored }
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db.settings.put({ key, value })
}

/** Makes sure the program start date is stored on first launch, so it doesn't move every day. */
export async function ensureStartDate(): Promise<void> {
  if (!(await db.settings.get('startDate'))) await saveSetting('startDate', today())
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(loadSettings, [])
}
