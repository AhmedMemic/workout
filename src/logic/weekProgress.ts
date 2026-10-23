import type { Session } from '../db/db'
import type { TemplateId } from '../data/templates'
import { addDays, startOfWeek, type ISODate } from './dates'
import { planFor, type DayKind } from './schedule'

const DESK: TemplateId[] = ['deskReset', 'deskResetShort']

export type DayState = 'done' | 'missed' | 'today' | 'upcoming' | 'rest'

export interface WeekDay {
  date: ISODate
  kind: DayKind
  state: DayState
}

export interface WeekProgress {
  days: WeekDay[]
  done: number
  planned: number
}

/**
 * This week's planned workouts (Mon–Sat; Sunday is rest) and which are done. A strength
 * day also counts when it was made up the next day. Desk resets don't count here.
 */
export function weekProgress(sessions: Session[], date: ISODate): WeekProgress {
  const workoutDays = new Set(sessions.filter((s) => s.status === 'done' && !DESK.includes(s.templateId)).map((s) => s.date))
  const weekStart = startOfWeek(date)
  const days = Array.from({ length: 7 }, (_, i): WeekDay => {
    const d = addDays(weekStart, i)
    const kind = planFor(d).kind
    const done = workoutDays.has(d) || (kind === 'strength' && workoutDays.has(addDays(d, 1)))
    let state: DayState
    if (kind === 'rest') state = 'rest'
    else if (done) state = 'done'
    else if (d < date) state = 'missed'
    else if (d === date) state = 'today'
    else state = 'upcoming'
    return { date: d, kind, state }
  })
  const planned = days.filter((d) => d.kind !== 'rest')
  return { days, done: planned.filter((d) => d.state === 'done').length, planned: planned.length }
}
