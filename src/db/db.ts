import Dexie, { type Table } from 'dexie'
import type { ChainId } from '../data/types'
import type { TemplateId } from '../data/templates'
import type { ChallengeTask } from '../data/challenges'
import type { ISODate } from '../logic/dates'

export interface LoggedSet {
  slotId?: string
  exerciseId: string
  setNo: number
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
  }
}

export const db = new CornerDB()

export const tableNames = ['settings', 'sessions', 'levels', 'daily', 'challenges', 'challengeDays', 'tests'] as const
