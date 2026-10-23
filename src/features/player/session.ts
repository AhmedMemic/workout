import { db, type LoggedSet, type Session, type SessionRating } from '../../db/db'
import { updateDaily, setLevel } from '../../db/queries'
import { templates, type Slot, type TemplateId } from '../../data/templates'
import type { ChainId } from '../../data/types'
import { chains } from '../../data/chains'
import { today } from '../../logic/dates'
import { levelOf, nextLevel, type Levels } from '../../logic/progression'
import type { Step } from './steps'

/** Resumes today's unfinished session of this template, or starts a new one. Older unfinished ones are dropped. */
export async function startOrResume(templateId: TemplateId): Promise<Session> {
  const date = today()
  const active = await db.sessions.where('status').equals('active').toArray()
  const match = active.find((s) => s.templateId === templateId && s.date === date)
  const stale = active.filter((s) => s !== match).map((s) => s.id!)
  if (stale.length) await db.sessions.bulkDelete(stale)
  if (match) return match
  const session: Session = { date, templateId, status: 'active', startedAt: Date.now(), sets: [], cursor: 0 }
  session.id = await db.sessions.add(session)
  return session
}

export async function saveProgress(id: number, cursor: number, sets: LoggedSet[]): Promise<void> {
  await db.sessions.update(id, { cursor, sets })
}

export async function discardSession(id: number): Promise<void> {
  await db.sessions.delete(id)
}

export async function rateSession(id: number, patch: { rating?: SessionRating; note?: string }): Promise<void> {
  await db.sessions.update(id, patch)
}

export interface LevelUp {
  chain: ChainId
  exerciseId: string
}

/** Marks the session done, applies progression and daily side effects. Returns level-ups for the summary. */
export async function finishSession(
  session: Session,
  sets: LoggedSet[],
  steps: Step[],
  levels: Levels,
  walkMin?: number,
): Promise<LevelUp[]> {
  const levelUps: LevelUp[] = []
  const template = templates[session.templateId]

  if (template.kind === 'strength') {
    const slots = new Map<string, Slot>()
    let plannedSets = 0
    for (const s of steps) if (s.type === 'set') {
      slots.set(s.slot.id, s.slot)
      plannedSets = s.totalSets
    }
    for (const slot of slots.values()) {
      if (!slot.chain) continue
      const current = chains[slot.chain].steps[levelOf(slot.chain, levels)]
      // only sets done with the current step count (not ones before a "too hard" swap);
      // a two-sided set counts with its weaker side
      const bySet = new Map<number, number>()
      for (const x of sets) {
        if (x.slotId !== slot.id || x.exerciseId !== current) continue
        const value = x.reps ?? x.seconds ?? 0
        bySet.set(x.setNo, Math.min(bySet.get(x.setNo) ?? Infinity, value))
      }
      const results = [...bySet.values()]
      const next = nextLevel(slot, levels, results, plannedSets)
      if (next !== undefined) {
        await setLevel(slot.chain, next)
        levelUps.push({ chain: slot.chain, exerciseId: chains[slot.chain].steps[next] })
      }
    }
  }

  if (session.templateId === 'deskReset' || session.templateId === 'deskResetShort') {
    await updateDaily(session.date, { deskReset: true })
  }
  if (template.kind === 'walk' && walkMin) {
    const existing = (await db.daily.get(session.date))?.walkMin ?? 0
    await updateDaily(session.date, { walkMin: existing + walkMin })
  }

  await db.sessions.update(session.id!, { status: 'done', endedAt: Date.now(), sets })
  return levelUps
}
