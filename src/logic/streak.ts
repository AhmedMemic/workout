import { addDays, type ISODate } from './dates'

/** Days that don't break a streak when empty (planned rest), and don't add to it either. */
export type RestDay = (day: ISODate) => boolean

const never: RestDay = () => false

/** The neighbouring day in a run, stepping over one empty rest day. */
function neighbour(active: Set<ISODate>, day: ISODate, dir: 1 | -1, isRest: RestDay): ISODate {
  const next = addDays(day, dir)
  return !active.has(next) && isRest(next) ? addDays(next, dir) : next
}

/**
 * Consecutive active days ending today. If today has no activity yet, the streak
 * from yesterday still counts (it isn't broken until the day is over).
 */
export function currentStreak(active: Set<ISODate>, today: ISODate, isRest: RestDay = never): number {
  let day = active.has(today) ? today : neighbour(active, today, -1, isRest)
  let n = 0
  while (active.has(day)) {
    n++
    day = neighbour(active, day, -1, isRest)
  }
  return n
}

export function bestStreak(active: Set<ISODate>, isRest: RestDay = never): number {
  let best = 0
  for (const day of active) {
    if (active.has(neighbour(active, day, -1, isRest))) continue // not the start of a run
    let n = 0
    let d = day
    while (active.has(d)) {
      n++
      d = neighbour(active, d, 1, isRest)
    }
    best = Math.max(best, n)
  }
  return best
}
