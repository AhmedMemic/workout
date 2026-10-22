import { addDays, diffDays, type ISODate } from './dates'

export const RETEST_DAYS = 28

export interface TestStatus {
  due: boolean
  /** First day of the current 4-week window; a test on or after it counts. */
  since: ISODate
  /** 1 = baseline, 2 = first re-test… */
  number: number
  /** Start of the next window. */
  next: ISODate
}

/** Baseline in the first week, then a re-test every 4 weeks from the program start. */
export function testStatus(startDate: ISODate, testDates: ISODate[], today: ISODate): TestStatus {
  const days = Math.max(0, diffDays(startDate, today))
  const n = Math.floor(days / RETEST_DAYS)
  const since = addDays(startDate, n * RETEST_DAYS)
  return {
    due: !testDates.some((d) => d >= since && d <= today),
    since,
    number: n + 1,
    next: addDays(since, RETEST_DAYS),
  }
}
