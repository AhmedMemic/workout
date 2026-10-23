import type { Challenge, ChallengeDay, DailyLog, Goal, Session, TestResult } from '../db/db'
import { chains, defaultLevels } from '../data/chains'
import type { ChainId } from '../data/types'
import type { BadgeStats } from './badges'
import { isDayComplete } from './challenge'
import { daysInMonth, monthKey, type ISODate } from './dates'
import { weightAverage } from './goals'
import type { Levels } from './progression'
import { isRestDay } from './schedule'
import { bestStreak } from './streak'

export interface AllData {
  sessions: Session[]
  daily: DailyLog[]
  tests: TestResult[]
  goals: Goal[]
  levels: Levels
  challenges: Challenge[]
  challengeDays: ChallengeDay[]
}

const isDeskReset = (s: Session) => s.templateId === 'deskReset' || s.templateId === 'deskResetShort'

/** Days with any activity: a finished session, the desk reset, or a full challenge day. */
export function activeDates(data: AllData): Set<ISODate> {
  const active = new Set<ISODate>()
  for (const s of data.sessions) if (s.status === 'done') active.add(s.date)
  for (const d of data.daily) if (d.deskReset) active.add(d.date)
  const tasks = new Map(data.challenges.map((c) => [c.month, c.tasks]))
  for (const day of data.challengeDays) {
    const t = tasks.get(day.month)
    if (t && isDayComplete(t, day.done)) active.add(day.date)
  }
  return active
}

/** Months whose challenge was done on every day from its start to the month's end. */
export function fullChallengeMonths(data: AllData, today: ISODate): number {
  let n = 0
  for (const c of data.challenges) {
    if (c.month >= monthKey(today)) continue
    const done = new Map(data.challengeDays.filter((d) => d.month === c.month).map((d) => [d.date, d.done]))
    const days = daysInMonth(c.month)
    let all = true
    for (let day = c.startDay ?? 1; day <= days && all; day++) {
      const date = `${c.month}-${String(day).padStart(2, '0')}`
      all = isDayComplete(c.tasks, done.get(date) ?? [])
    }
    if (all) n++
  }
  return n
}

export function computeStats(data: AllData, today: ISODate): BadgeStats {
  const done = data.sessions.filter((s) => s.status === 'done')
  const weighIns = data.daily.filter((d) => d.weightKg)
  const latest = weighIns.at(-1)
  const nowAvg = latest ? weightAverage(data.daily, latest.date) : undefined
  const levelUps = (Object.keys(chains) as ChainId[]).reduce(
    (sum, c) => sum + Math.max(0, (data.levels[c] ?? defaultLevels[c]) - defaultLevels[c]),
    0,
  )
  return {
    workouts: done.filter((s) => !isDeskReset(s)).length,
    deskResets: data.daily.filter((d) => d.deskReset).length,
    bestStreak: bestStreak(activeDates(data), isRestDay),
    levelUps,
    fullChallengeMonths: fullChallengeMonths(data, today),
    weightLost: weighIns.length && nowAvg !== undefined ? Math.max(0, Math.round((weighIns[0].weightKg! - nowAvg) * 10) / 10) : 0,
    tests: data.tests.length,
    goalsReached: data.goals.filter((g) => g.reachedAt).length,
  }
}
