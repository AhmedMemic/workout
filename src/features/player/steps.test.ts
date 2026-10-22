import { describe, expect, it } from 'vitest'
import { buildSteps, nextWorkStep, prevWorkStep } from './steps'

describe('buildSteps', () => {
  it('strength: warm-up, pairs × sets with rest, grip, cool-down', () => {
    const steps = buildSteps('strengthA', 2)
    const sets = steps.filter((s) => s.type === 'set')
    expect(sets).toHaveLength(3 * 2 * 2) // 3 pairs × 2 exercises × 2 sets
    expect(steps[0].section).toBe('warmUp')
    expect(steps.at(-1)!.section).toBe('coolDown')
    // after each 1b comes a rest
    const i = steps.findIndex((s) => s.type === 'set' && s.slot.id === 'A1b')
    expect(steps[i + 1].type).toBe('rest')
  })

  it('per-side timed items become two steps', () => {
    const steps = buildSteps('coolDown', 1)
    expect(steps.filter((s) => s.type === 'timed' && s.exerciseId === 'hip-flexor-stretch')).toHaveLength(2)
  })

  it('per-side reps become two steps, alternating ones stay one', () => {
    const grip = buildSteps('gripFinisher', 1)
    expect(grip.filter((s) => s.type === 'reps' && s.exerciseId === 'hand-gripper').map((s) => s.type === 'reps' && s.side)).toEqual([1, 2])
    const warm = buildSteps('warmUp', 1)
    expect(warm.filter((s) => s.type === 'reps' && s.exerciseId === 'worlds-greatest-stretch')).toHaveLength(1)
  })

  it('back skips over rests', () => {
    const steps = buildSteps('boxingRounds', 1)
    expect(prevWorkStep(steps, 2)).toBe(0)
    expect(prevWorkStep(steps, 0)).toBeUndefined()
  })

  it('boxing: 6 rounds with rest between, none at the end', () => {
    const steps = buildSteps('boxingRounds', 1)
    expect(steps.filter((s) => s.type === 'timed')).toHaveLength(6)
    expect(steps.filter((s) => s.type === 'rest')).toHaveLength(5)
    expect(steps.at(-1)!.type).toBe('timed')
  })

  it('circuit: every exercise every round', () => {
    expect(buildSteps('lowImpactCircuit', 1).filter((s) => s.type === 'timed')).toHaveLength(4 * 5)
  })

  it('finds the next non-rest step', () => {
    const steps = buildSteps('boxingRounds', 1)
    expect(nextWorkStep(steps, 0)).toBe(steps[2])
    expect(nextWorkStep(steps, steps.length - 1)).toBeUndefined()
  })
})
