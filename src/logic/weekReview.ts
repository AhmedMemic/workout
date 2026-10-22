import type { TemplateId } from '../data/templates'
import { habits } from '../data/habits'
import { isDayComplete } from './challenge'
import { addDays, weekday, type ISODate } from './dates'
import { weightAverage } from './goals'
import type { AllData } from './stats'
import { planFor } from './schedule'

const STRENGTH: TemplateId[] = ['strengthA', 'strengthB', 'strengthC']
const DESK: TemplateId[] = ['deskReset', 'deskResetShort']

export type Focus =
  | { key: 'missedDay'; day: number }
  | { key: 'strength'; done: number }
  | { key: 'deskReset' }
  | { key: 'food' }
  | { key: 'weightUp' }
  | { key: 'steps' }
  | { key: 'keepGoing' }

export interface WeekReview {
  weekStart: ISODate
  strength: number
  strengthPlanned: number
  otherWorkouts: number
  /** Workouts (excluding desk resets) the week before, for comparison. */
  lastWeekWorkouts: number
  /** Change in the 7-day weight average over the week; undefined without weigh-ins at both ends. */
  weightChange?: number
  deskResets: number
  /** Share of food-habit ticks out of everything possible this week (0–1). */
  food: number
  challengeDays: number
  /** Days the step goal was hit / days with steps logged. */
  stepDays: number
  stepsLogged: number
  activeDays: number
  focus: Focus
}

function days(weekStart: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** Strength days (Mon/Wed/Fri) with no strength session that day or the make-up day after. */
function missedStrengthDays(data: AllData, weekStart: ISODate): number[] {
  const done = new Set(data.sessions.filter((s) => s.status === 'done' && STRENGTH.includes(s.templateId)).map((s) => s.date))
  return days(weekStart)
    .filter((d) => planFor(d).kind === 'strength' && !done.has(d) && !done.has(addDays(d, 1)))
    .map(weekday)
}

/** Summary of one Monday–Sunday week, plus one thing to focus on next week. */
export function weekReview(data: AllData, weekStart: ISODate, stepGoal: number): WeekReview {
  const week = days(weekStart)
  const weekEnd = week[6]
  const inWeek = (d: ISODate) => d >= weekStart && d <= weekEnd
  const done = data.sessions.filter((s) => s.status === 'done')
  const thisWeek = done.filter((s) => inWeek(s.date))
  const workouts = (list: typeof done) => list.filter((s) => !DESK.includes(s.templateId))
  const strength = thisWeek.filter((s) => STRENGTH.includes(s.templateId)).length
  const lastWeekStart = addDays(weekStart, -7)
  const lastWeekWorkouts = workouts(done.filter((s) => s.date >= lastWeekStart && s.date < weekStart)).length

  const daily = data.daily.filter((d) => inWeek(d.date))
  const deskResets = daily.filter((d) => d.deskReset).length
  const foodTicks = daily.reduce((n, d) => n + habits.filter((h) => d.food?.[h.id]).length, 0)
  const food = foodTicks / (habits.length * 7)
  const stepsLogged = daily.filter((d) => d.steps !== undefined).length
  const stepDays = daily.filter((d) => (d.steps ?? 0) >= stepGoal).length

  const tasks = new Map(data.challenges.map((c) => [c.month, c.tasks]))
  const challengeDays = data.challengeDays.filter((c) => inWeek(c.date) && isDayComplete(tasks.get(c.month) ?? [], c.done)).length

  const end = weightAverage(data.daily, weekEnd)
  const start = weightAverage(data.daily, addDays(weekStart, -1))
  const weightChange = end !== undefined && start !== undefined ? Math.round((end - start) * 10) / 10 : undefined

  const active = new Set([...thisWeek.map((s) => s.date), ...daily.filter((d) => d.deskReset).map((d) => d.date)])

  // the one thing to work on next week, most important first
  const missedNow = missedStrengthDays(data, weekStart)
  const missedBefore = missedStrengthDays(data, lastWeekStart)
  const repeat = missedNow.find((d) => missedBefore.includes(d))
  let focus: Focus
  if (repeat !== undefined) focus = { key: 'missedDay', day: repeat }
  else if (strength < 3) focus = { key: 'strength', done: strength }
  else if (deskResets < 3) focus = { key: 'deskReset' }
  else if (food < 0.5) focus = { key: 'food' }
  else if (weightChange !== undefined && weightChange > 0.5) focus = { key: 'weightUp' }
  else if (stepsLogged > 0 && stepDays < stepsLogged / 2) focus = { key: 'steps' }
  else focus = { key: 'keepGoing' }

  return {
    weekStart,
    strength,
    strengthPlanned: 3,
    otherWorkouts: workouts(thisWeek).length - strength,
    lastWeekWorkouts,
    weightChange,
    deskResets,
    food,
    challengeDays,
    stepDays,
    stepsLogged,
    activeDays: active.size,
    focus,
  }
}
