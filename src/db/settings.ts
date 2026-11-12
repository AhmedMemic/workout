import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { today } from '../logic/dates'
import type { PlanSwaps } from '../logic/schedule'

export interface Settings {
  /** Day 1 of the program (blocks and weeks count from here). */
  startDate: string
  stepGoal: number
  playlistUrl: string
  walkoutUrl: string
  /** Play songs added to the app in random order. */
  musicShuffle: boolean
  /** Spoken exercise names and cues in the player. */
  voice: boolean
  /** Get-ready countdown before timed work, in seconds. */
  readySec: number
  /** Start of the test window the user chose to skip, so the reminder stays quiet until the next one. */
  retestSkipped: string
  /** Milestones already celebrated on Today. */
  seenBadges: string[]
  /** Day of the last export, for the backup reminder ('' = never). */
  lastBackupAt: string
  /** Backup reminder hidden until this day. */
  backupSnoozedUntil: string
  /** Monday of the week whose review was dismissed on Today. */
  reviewSeenWeek: string
  /** Standing-desk goal per work day, in minutes. */
  standGoalMin: number
  /** Remind to sit after standing this long, and to stand after sitting this long (minutes). */
  standForMin: number
  sitForMin: number
  deskReminders: boolean
  /** Days moved around on the Plan screen (see logic/schedule). */
  planSwaps: PlanSwaps
}

export const defaultSettings = (): Settings => ({
  startDate: today(),
  stepGoal: 7000,
  playlistUrl: '',
  walkoutUrl: '',
  musicShuffle: true,
  voice: true,
  readySec: 10,
  retestSkipped: '',
  seenBadges: [],
  lastBackupAt: '',
  backupSnoozedUntil: '',
  reviewSeenWeek: '',
  standGoalMin: 120,
  standForMin: 30,
  sitForMin: 45,
  deskReminders: true,
  planSwaps: {},
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
