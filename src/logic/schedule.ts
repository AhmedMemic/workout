import type { TemplateId } from '../data/templates'
import { addDays, diffDays, weekday, type ISODate } from './dates'

export type DayKind = 'strength' | 'cardio' | 'walk' | 'rest'

export interface DayPlan {
  kind: DayKind
  /** Suggested session; the first is the default. Empty on rest days. */
  options: TemplateId[]
}

/** Weekly schedule (Workout program › Weekly schedule), Monday first. */
const week: DayPlan[] = [
  { kind: 'strength', options: ['strengthA'] },
  { kind: 'cardio', options: ['walk', 'lowImpactCircuit', 'dumbbellComplex'] },
  { kind: 'strength', options: ['strengthB'] },
  { kind: 'cardio', options: ['boxingRounds', 'walk'] },
  { kind: 'strength', options: ['strengthC'] },
  { kind: 'walk', options: ['longWalk'] },
  { kind: 'rest', options: [] },
]

export function planFor(date: ISODate): DayPlan {
  return week[weekday(date)]
}

/** Planned rest day: an empty one doesn't break the streak. */
export function isRestDay(date: ISODate): boolean {
  return planFor(date).kind === 'rest'
}

export interface ProgramPosition {
  /** 1-based 4-week block. */
  block: number
  /** 1–4 within the block. */
  week: number
  deload: boolean
}

export function programPosition(startDate: ISODate, date: ISODate): ProgramPosition {
  const days = Math.max(0, diffDays(startDate, date))
  const weekIndex = Math.floor(days / 7)
  const block = Math.floor(weekIndex / 4) + 1
  const weekInBlock = (weekIndex % 4) + 1
  return { block, week: weekInBlock, deload: weekInBlock === 4 }
}

/** Sets per exercise: block 1 = 2, then 3; deload week = one less. */
export function setsFor(pos: ProgramPosition): number {
  const base = pos.block === 1 ? 2 : 3
  return pos.deload ? Math.max(1, base - 1) : base
}

/**
 * Today's main session. If today is not a strength day and yesterday's strength
 * session was skipped, offer it as a make-up first.
 */
export function sessionOptionsFor(date: ISODate, doneByDate: Map<ISODate, TemplateId[]>): {
  plan: DayPlan
  options: TemplateId[]
  makeUp?: TemplateId
} {
  const plan = planFor(date)
  if (plan.kind === 'strength') return { plan, options: plan.options }

  const yesterday = addDays(date, -1)
  const yPlan = planFor(yesterday)
  const yDone = doneByDate.get(yesterday) ?? []
  if (yPlan.kind === 'strength' && !yDone.includes(yPlan.options[0])) {
    const makeUp = yPlan.options[0]
    return { plan, options: [makeUp, ...plan.options], makeUp }
  }
  return { plan, options: plan.options }
}
