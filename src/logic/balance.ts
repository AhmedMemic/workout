import type { TestResult } from '../db/db'
import type { ISODate } from './dates'

/** One-leg stand is capped at 60 s in the test. */
export const BALANCE_MAX = 60
/**
 * About what healthy adults under 60 hold with eyes open (Springer et al. 2007 report
 * roughly 37–43 s up to 59), so 30 s on both legs is a fair point to start letting go of the wall.
 */
export const OFF_WALL_SEC = 30

export type Side = 'left' | 'right'

export interface BalanceRow {
  date: ISODate
  left?: number
  right?: number
}

export interface BalanceStatus {
  /** Tests with at least one side, oldest first. */
  rows: BalanceRow[]
  latest?: BalanceRow
  /** Set when one side is clearly weaker: 5 s or more and at least 20% below the other. */
  weaker?: Side
  gap: number
  /** Both sides reached OFF_WALL_SEC in the latest test. */
  readyOffWall: boolean
}

export function balanceStatus(tests: TestResult[]): BalanceStatus {
  const rows = tests
    .filter((t) => t.balanceLeftSec !== undefined || t.balanceRightSec !== undefined)
    .map((t) => ({ date: t.date, left: t.balanceLeftSec, right: t.balanceRightSec }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const latest = rows.at(-1)
  if (!latest || latest.left === undefined || latest.right === undefined) {
    return { rows, latest, gap: 0, readyOffWall: false }
  }
  const { left, right } = latest
  const gap = Math.abs(left - right)
  const stronger = Math.max(left, right)
  const weaker: Side | undefined = gap >= 5 && gap >= stronger * 0.2 ? (left < right ? 'left' : 'right') : undefined
  return { rows, latest, weaker, gap, readyOffWall: left >= OFF_WALL_SEC && right >= OFF_WALL_SEC }
}
