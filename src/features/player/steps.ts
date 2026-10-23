import type { L10n } from '../../i18n/I18nProvider'
import { exerciseById } from '../../data/exercises'
import { templates, type FlowTemplate, type Slot, type TemplateId } from '../../data/templates'

export type Section = 'warmUp' | 'main' | 'gripFinisher' | 'coolDown'

/** A strength set that gets logged (reps or seconds). Exercise resolves live, so "too hard" can swap it. */
export interface SetStep {
  type: 'set'
  section: Section
  slot: Slot
  setNo: number
  totalSets: number
  /** Rest after this step (0 = go straight to the paired exercise). */
  restAfter: number
}

/** Guided item with a fixed count — just do it and tap Done. */
export interface RepsStep {
  type: 'reps'
  section: Section
  exerciseId: string
  reps: number
  perSide: boolean
  side?: 1 | 2
  round?: number
  totalRounds?: number
}

/** Work for a fixed time, counted down. */
export interface TimedStep {
  type: 'timed'
  section: Section
  exerciseId: string
  seconds: number
  side?: 1 | 2
  round?: number
  totalRounds?: number
  focus?: L10n
}

export interface RestStep {
  type: 'rest'
  section: Section
  seconds: number
}

export interface WalkStep {
  type: 'walk'
  section: Section
  minutes: number
}

export type Step = SetStep | RepsStep | TimedStep | RestStep | WalkStep

function flowSteps(t: FlowTemplate, section: Section): Step[] {
  const steps: Step[] = []
  for (const item of t.items) {
    const perSide = item.perSide ?? !!exerciseById[item.exerciseId].perSide
    if (item.seconds) {
      if (perSide) {
        steps.push({ type: 'timed', section, exerciseId: item.exerciseId, seconds: item.seconds, side: 1 })
        steps.push({ type: 'timed', section, exerciseId: item.exerciseId, seconds: item.seconds, side: 2 })
      } else {
        steps.push({ type: 'timed', section, exerciseId: item.exerciseId, seconds: item.seconds })
      }
    } else if (perSide && !exerciseById[item.exerciseId].alternating) {
      const reps = item.reps ?? 10
      steps.push({ type: 'reps', section, exerciseId: item.exerciseId, reps, perSide, side: 1 })
      steps.push({ type: 'reps', section, exerciseId: item.exerciseId, reps, perSide, side: 2 })
    } else {
      steps.push({ type: 'reps', section, exerciseId: item.exerciseId, reps: item.reps ?? 10, perSide })
    }
  }
  return steps
}

/** Turns a template into the ordered list of screens the player walks through. */
export function buildSteps(templateId: TemplateId, sets: number): Step[] {
  const t = templates[templateId]
  switch (t.kind) {
    case 'strength': {
      const steps: Step[] = [...flowSteps(templates.warmUp as FlowTemplate, 'warmUp')]
      for (const [a, b] of t.pairs) {
        for (let setNo = 1; setNo <= sets; setNo++) {
          steps.push({ type: 'set', section: 'main', slot: a, setNo, totalSets: sets, restAfter: 0 })
          steps.push({ type: 'set', section: 'main', slot: b, setNo, totalSets: sets, restAfter: t.restSec })
          steps.push({ type: 'rest', section: 'main', seconds: t.restSec })
        }
      }
      steps.push(...flowSteps(templates.gripFinisher as FlowTemplate, 'gripFinisher'))
      steps.push(...flowSteps(templates.coolDown as FlowTemplate, 'coolDown'))
      return steps
    }
    case 'flow':
      return flowSteps(t, 'main')
    case 'rounds': {
      const steps: Step[] = []
      for (let r = 1; r <= t.rounds; r++) {
        const focus = t.roundFocus?.[r - 1]
        for (const exerciseId of t.exerciseIds) {
          steps.push({ type: 'timed', section: 'main', exerciseId, seconds: t.workSec, round: r, totalRounds: t.rounds, focus })
          steps.push({ type: 'rest', section: 'main', seconds: t.restSec })
        }
      }
      steps.pop() // no rest after the last interval
      return steps
    }
    case 'complex': {
      const steps: Step[] = []
      for (let r = 1; r <= t.rounds; r++) {
        for (const item of t.items) {
          steps.push({ type: 'reps', section: 'main', exerciseId: item.exerciseId, reps: item.reps, perSide: false, round: r, totalRounds: t.rounds })
        }
        if (r < t.rounds) steps.push({ type: 'rest', section: 'main', seconds: t.restSec })
      }
      return steps
    }
    case 'walk':
      return [{ type: 'walk', section: 'main', minutes: t.minutes }]
  }
}

/** The previous step that isn't a rest, for the Back button. */
export function prevWorkStep(steps: Step[], from: number): number | undefined {
  for (let i = from - 1; i >= 0; i--) if (steps[i].type !== 'rest') return i
  return undefined
}

/** The next step that isn't a rest, for the "Up next" card. */
export function nextWorkStep(steps: Step[], from: number): Step | undefined {
  for (let i = from + 1; i < steps.length; i++) if (steps[i].type !== 'rest') return steps[i]
  return undefined
}

/** One entry per exercise (per slot for strength sets) and section, for the session overview. */
export function overviewSteps(steps: Step[]): Step[] {
  const seen = new Set<string>()
  return steps.filter((s) => {
    if (s.type === 'rest') return false
    const key = `${s.section}:${s.type === 'set' ? s.slot.id : s.type === 'walk' ? 'walk' : s.exerciseId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
