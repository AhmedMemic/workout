import type { DailyLog, Goal, GoalMetric, TestResult } from '../db/db'
import { addDays, type ISODate } from './dates'

export const lowerIsBetter = (metric: GoalMetric) => metric === 'weight' || metric === 'waistCm'

/** Average of the weigh-ins in the 7 days ending at `date`. */
export function weightAverage(daily: DailyLog[], date: ISODate): number | undefined {
  const from = addDays(date, -6)
  const window = daily.filter((d) => d.weightKg && d.date >= from && d.date <= date)
  if (!window.length) return undefined
  return Math.round((window.reduce((s, d) => s + d.weightKg!, 0) / window.length) * 10) / 10
}

/** Where a metric stands now: weight = 7-day average at the latest weigh-in, tests = latest result. */
export function currentValue(metric: GoalMetric, daily: DailyLog[], tests: TestResult[]): number | undefined {
  if (metric === 'weight') {
    const last = daily.filter((d) => d.weightKg).at(-1)
    return last ? weightAverage(daily, last.date) : undefined
  }
  const latest = [...tests].sort((a, b) => a.date.localeCompare(b.date)).findLast((t) => t[metric] !== undefined)
  return latest?.[metric]
}

export function isReached(goal: Pick<Goal, 'metric' | 'target'>, current: number | undefined): boolean {
  if (current === undefined) return false
  return lowerIsBetter(goal.metric) ? current <= goal.target : current >= goal.target
}

/** 0–1 share of the way from the start value to the target. */
export function goalProgress(goal: Goal, current: number | undefined): number {
  if (goal.reachedAt || isReached(goal, current)) return 1
  if (current === undefined || goal.target === goal.start) return 0
  return Math.min(Math.max((current - goal.start) / (goal.target - goal.start), 0), 1)
}
