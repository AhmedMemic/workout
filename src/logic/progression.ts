import { chains, defaultLevels } from '../data/chains'
import { exerciseById } from '../data/exercises'
import type { Range, Slot } from '../data/templates'
import type { ChainId } from '../data/types'

export type Levels = Partial<Record<ChainId, number>>

export function levelOf(chain: ChainId, levels: Levels): number {
  return clampLevel(chain, levels[chain] ?? defaultLevels[chain])
}

export function clampLevel(chain: ChainId, step: number): number {
  return Math.min(Math.max(step, 0), chains[chain].steps.length - 1)
}

/** The exercise a slot uses right now. */
export function resolveSlot(slot: Slot, levels: Levels): string {
  if (slot.chain) return chains[slot.chain].steps[levelOf(slot.chain, levels)]
  return slot.exerciseId!
}

export interface Target {
  measure: 'reps' | 'time'
  min: number
  max: number
  perSide: boolean
}

export function targetFor(slot: Slot, exerciseId: string): Target {
  const ex = exerciseById[exerciseId]
  const range: Range | undefined = ex.measure === 'time' ? slot.time : slot.reps
  const fallback = ex.measure === 'time' ? { min: 20, max: 40 } : { min: 8, max: 15 }
  return { measure: ex.measure, ...(range ?? fallback), perSide: !!ex.perSide }
}

/**
 * Double progression: every planned set reached the top of the range → move up a step.
 * Returns the chain's new level, or undefined when nothing changes.
 */
export function nextLevel(
  slot: Slot,
  levels: Levels,
  results: number[],
  plannedSets: number,
): number | undefined {
  if (!slot.chain) return undefined
  const current = levelOf(slot.chain, levels)
  const target = targetFor(slot, chains[slot.chain].steps[current])
  const hitTop = results.length >= plannedSets && results.every((r) => r >= target.max)
  if (!hitTop) return undefined
  const next = clampLevel(slot.chain, current + 1)
  return next === current ? undefined : next
}
