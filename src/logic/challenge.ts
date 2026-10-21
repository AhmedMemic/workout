import type { ChallengeTask } from '../data/challenges'

/**
 * Target for a 1-based day, rising evenly from `target` to `rampTo` between the
 * challenge's start day (it may begin mid-month) and the end of the month.
 */
export function targetForDay(task: ChallengeTask, day: number, days: number, startDay = 1): number {
  if (task.rampTo === undefined || days <= startDay) return task.target
  const t = (Math.min(Math.max(day, startDay), days) - startDay) / (days - startDay)
  const raw = task.target + (task.rampTo - task.target) * t
  // seconds move in 5 s steps, everything else in whole units
  return task.unit === 'seconds' ? Math.round(raw / 5) * 5 : Math.round(raw)
}

export function isDayComplete(tasks: ChallengeTask[], done: string[]): boolean {
  return tasks.length > 0 && tasks.every((t) => done.includes(t.id))
}
