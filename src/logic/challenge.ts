import { challengeIdeas, type ChallengeTask, type TaskUnit } from '../data/challenges'
import type { L10n } from '../i18n/I18nProvider'
import type { ISODate } from './dates'

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

/** Tasks that apply on a date (a task added mid-month doesn't reach back). */
export function tasksOn(tasks: ChallengeTask[], date?: ISODate): ChallengeTask[] {
  return date ? tasks.filter((t) => !t.since || t.since <= date) : tasks
}

export function isDayComplete(tasks: ChallengeTask[], done: string[], date?: ISODate): boolean {
  const due = tasksOn(tasks, date)
  return due.length > 0 && due.every((t) => done.includes(t.id))
}

const fallbackName: L10n = { en: 'My challenge', bs: 'Moj izazov' }

export function challengeName(c: { ideaId: string; name?: L10n }): L10n {
  return c.name ?? challengeIdeas.find((i) => i.id === c.ideaId)?.name ?? fallbackName
}

/** One task row in the editor, as typed. */
export interface TaskDraft {
  id?: string
  name: string
  unit: TaskUnit
  target: string
  rampTo: string
}

export const draftFrom = (task: ChallengeTask, lang: keyof L10n): TaskDraft => ({
  id: task.id,
  name: task.name[lang],
  unit: task.unit,
  target: task.unit === 'check' ? '' : String(task.target),
  rampTo: task.rampTo === undefined ? '' : String(task.rampTo),
})

export type DraftError = 'noTasks' | 'noName' | 'badNumber'

/**
 * Turns editor rows back into tasks. Kept tasks keep their id (so ticks still match),
 * their translations and exercise link unless renamed; new tasks get `since` when
 * added to a challenge that is already running.
 */
export function tasksFromDrafts(
  drafts: TaskDraft[],
  original: ChallengeTask[],
  lang: keyof L10n,
  addedOn?: ISODate,
): { tasks: ChallengeTask[] } | { error: DraftError } {
  if (drafts.length === 0) return { error: 'noTasks' }
  const tasks: ChallengeTask[] = []
  for (const [i, d] of drafts.entries()) {
    const name = d.name.trim()
    if (!name) return { error: 'noName' }
    const old = original.find((t) => t.id === d.id)
    const renamed = !old || old.name[lang] !== name
    const task: ChallengeTask = {
      id: old?.id ?? `c${Date.now().toString(36)}${i}`,
      name: renamed ? { en: name, bs: name } : old.name,
      unit: d.unit,
      target: 1,
    }
    if (d.unit !== 'check') {
      const target = Number(d.target.trim())
      const rampTo = d.rampTo.trim() ? Number(d.rampTo.trim()) : undefined
      const ok = (n: number) => Number.isInteger(n) && n > 0 && n < 10000
      if (!ok(target) || (rampTo !== undefined && !ok(rampTo))) return { error: 'badNumber' }
      task.target = target
      if (rampTo !== undefined && rampTo !== target) task.rampTo = rampTo
    }
    if (!renamed && old.exerciseId) task.exerciseId = old.exerciseId
    const since = old ? old.since : addedOn
    if (since) task.since = since
    tasks.push(task)
  }
  return { tasks }
}
