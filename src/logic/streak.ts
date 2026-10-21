import { addDays, type ISODate } from './dates'

/**
 * Consecutive active days ending today. If today has no activity yet, the streak
 * from yesterday still counts (it isn't broken until the day is over).
 */
export function currentStreak(active: Set<ISODate>, today: ISODate): number {
  let day = active.has(today) ? today : addDays(today, -1)
  let n = 0
  while (active.has(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function bestStreak(active: Set<ISODate>): number {
  let best = 0
  for (const day of active) {
    if (active.has(addDays(day, -1))) continue // not the start of a run
    let n = 0
    let d = day
    while (active.has(d)) {
      n++
      d = addDays(d, 1)
    }
    best = Math.max(best, n)
  }
  return best
}
