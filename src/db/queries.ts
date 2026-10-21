import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ChallengeDay, type DailyLog } from './db'
import { challengeIdeas, starterChallenge } from '../data/challenges'
import type { TemplateId } from '../data/templates'
import type { ChainId } from '../data/types'
import { addDays, monthKey, type ISODate } from '../logic/dates'
import { isDayComplete } from '../logic/challenge'
import type { Levels } from '../logic/progression'

// ── Daily log ──────────────────────────────────────────────────

export function useDaily(date: ISODate): DailyLog | undefined {
  return useLiveQuery(() => db.daily.get(date), [date])
}

export async function updateDaily(date: ISODate, patch: Partial<Omit<DailyLog, 'date'>>): Promise<void> {
  await db.transaction('rw', db.daily, async () => {
    const current = (await db.daily.get(date)) ?? { date }
    await db.daily.put({ ...current, ...patch, date })
  })
}

export async function toggleFood(date: ISODate, habitId: string): Promise<void> {
  await db.transaction('rw', db.daily, async () => {
    const current = (await db.daily.get(date)) ?? { date }
    const food = { ...current.food, [habitId]: !current.food?.[habitId] }
    await db.daily.put({ ...current, food })
  })
}

// ── Sessions ───────────────────────────────────────────────────

/** Done session templates per date, for the last `days` days up to `to`. */
export function useDoneByDate(to: ISODate, days = 2): Map<ISODate, TemplateId[]> | undefined {
  return useLiveQuery(async () => {
    const from = addDays(to, -days)
    const rows = await db.sessions.where('date').between(from, to, true, true).toArray()
    const map = new Map<ISODate, TemplateId[]>()
    for (const s of rows) if (s.status === 'done') map.set(s.date, [...(map.get(s.date) ?? []), s.templateId])
    return map
  }, [to, days])
}

export function useActiveSession() {
  return useLiveQuery(() => db.sessions.where('status').equals('active').last(), [])
}

// ── Levels ─────────────────────────────────────────────────────

export function useLevels(): Levels | undefined {
  return useLiveQuery(async () => {
    const rows = await db.levels.toArray()
    return Object.fromEntries(rows.map((r) => [r.chain, r.step])) as Levels
  }, [])
}

export async function setLevel(chain: ChainId, step: number): Promise<void> {
  await db.levels.put({ chain, step })
}

// ── Monthly challenge ──────────────────────────────────────────

/** Creates this month's challenge (the starter, or a chosen idea) if it doesn't exist yet. */
export async function ensureChallenge(month: string, ideaId = starterChallenge.id): Promise<void> {
  if (await db.challenges.get(month)) return
  const idea = challengeIdeas.find((c) => c.id === ideaId) ?? starterChallenge
  await db.challenges.put({ month, ideaId: idea.id, tasks: idea.tasks })
}

export async function replaceChallenge(month: string, ideaId: string): Promise<void> {
  const idea = challengeIdeas.find((c) => c.id === ideaId) ?? starterChallenge
  await db.challenges.put({ month, ideaId: idea.id, tasks: idea.tasks })
}

export function useChallenge(month: string) {
  return useLiveQuery(() => db.challenges.get(month), [month])
}

export function useChallengeDays(month: string): Map<ISODate, string[]> | undefined {
  return useLiveQuery(async () => {
    const rows = await db.challengeDays.where('month').equals(month).toArray()
    return new Map(rows.map((r: ChallengeDay) => [r.date, r.done]))
  }, [month])
}

export async function toggleChallengeTask(date: ISODate, taskId: string): Promise<void> {
  const month = monthKey(date)
  await db.transaction('rw', db.challengeDays, async () => {
    const row = (await db.challengeDays.get([month, date])) ?? { month, date, done: [] }
    const done = row.done.includes(taskId) ? row.done.filter((id) => id !== taskId) : [...row.done, taskId]
    await db.challengeDays.put({ ...row, done })
  })
}

// ── Streak ─────────────────────────────────────────────────────

/** Days with any activity: a finished session, the desk reset, or a full challenge day. */
export function useActiveDates(): Set<ISODate> | undefined {
  return useLiveQuery(async () => {
    const active = new Set<ISODate>()
    for (const s of await db.sessions.where('status').equals('done').toArray()) active.add(s.date)
    for (const d of await db.daily.toArray()) if (d.deskReset) active.add(d.date)
    const challenges = new Map((await db.challenges.toArray()).map((c) => [c.month, c.tasks]))
    for (const day of await db.challengeDays.toArray()) {
      const tasks = challenges.get(day.month)
      if (tasks && isDayComplete(tasks, day.done)) active.add(day.date)
    }
    return active
  }, [])
}
