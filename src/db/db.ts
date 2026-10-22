import Dexie, { type Table } from 'dexie'
import type { ChainId } from '../data/types'
import type { TemplateId } from '../data/templates'
import type { ChallengeTask } from '../data/challenges'
import type { ISODate } from '../logic/dates'

export interface LoggedSet {
  slotId?: string
  exerciseId: string
  setNo: number
  /** 1 = left, 2 = right, for exercises done one side at a time. */
  side?: 1 | 2
  reps?: number
  seconds?: number
  weightKg?: number
  feel?: 'easy' | 'ok' | 'hard'
}

export interface Session {
  id?: number
  date: ISODate
  templateId: TemplateId
  status: 'active' | 'done'
  startedAt: number
  endedAt?: number
  sets: LoggedSet[]
  /** Player position, so an unfinished session can resume. */
  cursor?: number
}

export interface Level {
  chain: ChainId
  step: number
}

export interface DailyLog {
  date: ISODate
  weightKg?: number
  steps?: number
  deskReset?: boolean
  walkMin?: number
  food?: Record<string, boolean>
}

export interface Challenge {
  /** 'YYYY-MM' — one challenge per month. */
  month: string
  ideaId: string
  tasks: ChallengeTask[]
  /** Day of the month the challenge began (ramps and day counts start here). */
  startDay?: number
}

export interface ChallengeDay {
  month: string
  date: ISODate
  done: string[]
}

export interface TestResult {
  id?: number
  date: ISODate
  pushups?: number
  plankSec?: number
  squats60?: number
  toeTouch?: 'knee' | 'shin' | 'ankle' | 'toes' | 'floor'
  waistCm?: number
  hangSec?: number
}

export type GoalMetric = 'weight' | 'waistCm' | 'pushups' | 'plankSec' | 'squats60' | 'hangSec'

export interface Goal {
  id?: number
  metric: GoalMetric
  target: number
  /** Value when the goal was set, so progress can be shown as a bar. */
  start: number
  createdAt: ISODate
  deadline?: ISODate
  /** First day the target was reached; a goal stays reached after that. */
  reachedAt?: ISODate
}

export interface SettingRow {
  key: string
  value: unknown
}

export class CornerDB extends Dexie {
  settings!: Table<SettingRow, string>
  sessions!: Table<Session, number>
  levels!: Table<Level, ChainId>
  daily!: Table<DailyLog, ISODate>
  challenges!: Table<Challenge, string>
  challengeDays!: Table<ChallengeDay, [string, string]>
  tests!: Table<TestResult, number>
  goals!: Table<Goal, number>

  constructor(name = 'corner') {
    super(name)
    this.version(1).stores({
      settings: 'key',
      sessions: '++id, date, templateId, status',
      levels: 'chain',
      daily: 'date',
      challenges: 'month',
      challengeDays: '[month+date], month',
      tests: '++id, date',
    })
    this.version(2).stores({
      goals: '++id, metric',
    })
  }
}

export const db = new CornerDB()

export const tableNames = ['settings', 'sessions', 'levels', 'daily', 'challenges', 'challengeDays', 'tests', 'goals'] as const
