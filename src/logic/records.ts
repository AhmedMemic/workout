import type { LoggedSet, Session } from '../db/db'
import type { ISODate } from './dates'

export interface PersonalRecord {
  exerciseId: string
  value: number
  unit: 'reps' | 'seconds'
  /** Best before this one. */
  previous: number
}

const valueOf = (s: LoggedSet) => s.reps ?? s.seconds ?? 0

function bestOf(exerciseId: string, sets: LoggedSet[]): number | undefined {
  let best: number | undefined
  for (const s of sets) if (s.exerciseId === exerciseId) best = Math.max(best ?? 0, valueOf(s))
  return best
}

/**
 * A set that beats every earlier set of its exercise. `history` is sets from finished
 * sessions; a first try is never a record, since there's nothing to beat. `today` is
 * this session's earlier sets, so a record set again in set 2 only counts if it's higher.
 */
export function recordFor(set: LoggedSet, history: LoggedSet[], today: LoggedSet[] = []): PersonalRecord | undefined {
  const previous = bestOf(set.exerciseId, history)
  if (previous === undefined) return undefined
  const best = Math.max(previous, bestOf(set.exerciseId, today) ?? 0)
  const value = valueOf(set)
  if (value <= best) return undefined
  return { exerciseId: set.exerciseId, value, unit: set.seconds !== undefined ? 'seconds' : 'reps', previous }
}

/** Records set in one session, the best one per exercise, in order. */
export function sessionRecords(sets: LoggedSet[], history: LoggedSet[]): PersonalRecord[] {
  const byExercise = new Map<string, PersonalRecord>()
  sets.forEach((set, i) => {
    const record = recordFor(set, history, sets.slice(0, i))
    if (record) byExercise.set(set.exerciseId, record)
  })
  return [...byExercise.values()]
}

export interface ExerciseDay {
  date: ISODate
  /** Each logged set (and side), in the order done. */
  values: number[]
  /** The session's note, if one was written. */
  note?: string
}

export interface ExerciseHistory {
  unit: 'reps' | 'seconds'
  best: { value: number; date: ISODate }
  /** Newest first. */
  days: ExerciseDay[]
}

/** Every finished session that included this exercise; undefined if it was never logged. */
export function exerciseHistory(sessions: Session[], exerciseId: string): ExerciseHistory | undefined {
  const days: ExerciseDay[] = []
  let best: ExerciseHistory['best'] | undefined
  let unit: ExerciseHistory['unit'] = 'reps'
  const done = sessions.filter((s) => s.status === 'done').sort((a, b) => a.startedAt - b.startedAt)
  for (const session of done) {
    const sets = session.sets
      .filter((s) => s.exerciseId === exerciseId)
      .sort((a, b) => a.setNo - b.setNo || (a.side ?? 0) - (b.side ?? 0))
    if (!sets.length) continue
    const values = sets.map(valueOf)
    if (sets[0].seconds !== undefined) unit = 'seconds'
    for (const v of values) if (!best || v > best.value) best = { value: v, date: session.date }
    days.push({ date: session.date, values, ...(session.note && { note: session.note }) })
  }
  return best && { unit, best, days: days.reverse() }
}

export interface Stall {
  /** Sessions in a row without a better best set. */
  sessions: number
  /** Best set in that stretch. */
  best: number
  unit: ExerciseHistory['unit']
}

/**
 * Stuck: the last `n` sessions of an exercise never beat the best set of the first of them.
 * Each ladder step is its own exercise, so this only looks at the current level.
 */
export function stallOf(history: ExerciseHistory | undefined, n = 3): Stall | undefined {
  if (!history || history.days.length < n) return undefined
  const bests = history.days.slice(0, n).map((d) => Math.max(...d.values)) // newest first
  const start = bests[n - 1]
  if (bests.slice(0, n - 1).some((v) => v > start)) return undefined
  return { sessions: n, best: Math.max(...bests), unit: history.unit }
}

/** Best set per session, oldest first, for a chart. */
export function bestPerSession(history: ExerciseHistory): { date: ISODate; value: number }[] {
  return history.days.map((d) => ({ date: d.date, value: Math.max(...d.values) })).reverse()
}

/** The first day each exercise was logged: on a ladder, roughly when that step was reached. */
export function firstDone(sessions: Session[]): Map<string, ISODate> {
  const first = new Map<string, ISODate>()
  for (const s of sessions) {
    if (s.status !== 'done') continue
    for (const set of s.sets) {
      const seen = first.get(set.exerciseId)
      if (!seen || s.date < seen) first.set(set.exerciseId, s.date)
    }
  }
  return first
}
