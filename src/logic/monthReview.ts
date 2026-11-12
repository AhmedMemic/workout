import type { TemplateId } from '../data/templates'
import { chains, defaultLevels } from '../data/chains'
import type { LoggedSet } from '../db/db'
import { isDayComplete } from './challenge'
import { addDays, daysInMonth, type ISODate } from './dates'
import { weightAverage } from './goals'
import { firstDone, sessionRecords } from './records'
import { planFor, type PlanSwaps } from './schedule'
import { activeDates, type AllData } from './stats'

const STRENGTH: TemplateId[] = ['strengthA', 'strengthB', 'strengthC']
const DESK: TemplateId[] = ['deskReset', 'deskResetShort']

export interface MonthReview {
  month: string
  workouts: number
  /** Workouts the month before, for comparison. */
  lastMonthWorkouts: number
  strength: number
  /** Strength days in the plan this month (from the program start). */
  strengthPlanned: number
  activeDays: number
  days: number
  /** Ladder steps reached for the first time this month, above where the program started. */
  levelUps: string[]
  records: number
  challenge?: { done: number; of: number }
  /** Change in the 7-day weight average across the month. */
  weightChange?: number
  /** Latest waist test this month vs the last one before it. */
  waistChange?: number
  standMin: number
  deskResets: number
}

/** 'YYYY-MM' shifted by whole months. */
export function shiftMonthKey(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Summary of one calendar month. */
export function monthReview(data: AllData, month: string, startDate: ISODate, swaps: PlanSwaps = {}): MonthReview {
  const n = daysInMonth(month)
  const start = `${month}-01`
  const end = `${month}-${String(n).padStart(2, '0')}`
  const inMonth = (d: ISODate) => d >= start && d <= end
  const dates = Array.from({ length: n }, (_, i) => addDays(start, i))

  const done = data.sessions.filter((s) => s.status === 'done')
  const workouts = done.filter((s) => !DESK.includes(s.templateId))
  const prevStart = `${shiftMonthKey(month, -1)}-01`

  // records: each session's sets against everything logged before it
  let records = 0
  const history: LoggedSet[] = []
  for (const s of [...done].sort((a, b) => a.startedAt - b.startedAt)) {
    if (inMonth(s.date)) records += sessionRecords(s.sets, history).length
    history.push(...s.sets)
  }

  const first = firstDone(data.sessions)
  const levelUps: string[] = []
  for (const chain of Object.values(chains))
    chain.steps.forEach((id, i) => {
      const date = first.get(id)
      if (i > defaultLevels[chain.id] && date && inMonth(date) && !levelUps.includes(id)) levelUps.push(id)
    })

  const c = data.challenges.find((x) => x.month === month)
  const ticks = new Map(data.challengeDays.filter((d) => d.month === month).map((d) => [d.date, d.done]))
  const challenge = c && {
    done: dates.filter((d) => isDayComplete(c.tasks, ticks.get(d) ?? [], d)).length,
    of: n - (c.startDay ?? 1) + 1,
  }

  const wEnd = weightAverage(data.daily, end)
  const wStart = weightAverage(data.daily, addDays(start, -1))
  const waist = [...data.tests].filter((t) => t.waistCm !== undefined).sort((a, b) => a.date.localeCompare(b.date))
  const waistNow = waist.findLast((t) => inMonth(t.date))
  const waistBefore = waist.findLast((t) => t.date < start)

  const daily = data.daily.filter((d) => inMonth(d.date))
  const active = activeDates(data)

  return {
    month,
    workouts: workouts.filter((s) => inMonth(s.date)).length,
    lastMonthWorkouts: workouts.filter((s) => s.date >= prevStart && s.date < start).length,
    strength: done.filter((s) => inMonth(s.date) && STRENGTH.includes(s.templateId)).length,
    strengthPlanned: dates.filter((d) => d >= startDate && planFor(d, swaps).kind === 'strength').length,
    activeDays: dates.filter((d) => active.has(d)).length,
    days: n,
    levelUps,
    records,
    challenge,
    weightChange: wEnd !== undefined && wStart !== undefined ? round1(wEnd - wStart) : undefined,
    waistChange: waistNow && waistBefore ? round1(waistNow.waistCm! - waistBefore.waistCm!) : undefined,
    standMin: daily.reduce((s, d) => s + (d.standMin ?? 0), 0),
    deskResets: daily.filter((d) => d.deskReset).length,
  }
}
