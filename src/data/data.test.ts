import { describe, expect, it } from 'vitest'
import { exercises, exerciseById } from './exercises'
import { chains, defaultLevels } from './chains'
import { templates } from './templates'
import { challengeIdeas } from './challenges'

describe('static data', () => {
  it('has unique exercise ids', () => {
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length)
  })

  it('has the same number of steps in both languages', () => {
    for (const e of exercises) {
      expect(e.steps.bs.length, e.id).toBe(e.steps.en.length)
      expect(e.name.bs, e.id).toBeTruthy()
    }
  })

  it('chains reference real exercises and valid default levels', () => {
    for (const chain of Object.values(chains)) {
      for (const id of chain.steps) expect(exerciseById[id], `${chain.id}: ${id}`).toBeDefined()
      expect(defaultLevels[chain.id]).toBeLessThan(chain.steps.length)
    }
  })

  it('templates reference real exercises', () => {
    for (const t of Object.values(templates)) {
      const ids: string[] = []
      if (t.kind === 'strength') {
        for (const pair of t.pairs)
          for (const slot of pair) {
            expect(slot.exerciseId || slot.chain, slot.id).toBeTruthy()
            if (slot.exerciseId) ids.push(slot.exerciseId)
          }
      }
      if (t.kind === 'flow') ids.push(...t.items.map((i) => i.exerciseId))
      if (t.kind === 'rounds') ids.push(...t.exerciseIds)
      if (t.kind === 'complex') ids.push(...t.items.map((i) => i.exerciseId))
      for (const id of ids) expect(exerciseById[id], `${t.id}: ${id}`).toBeDefined()
    }
  })

  it('every slot can be measured for every exercise it may resolve to', () => {
    for (const t of Object.values(templates)) {
      if (t.kind !== 'strength') continue
      for (const pair of t.pairs)
        for (const slot of pair) {
          const ids = slot.chain ? chains[slot.chain].steps : [slot.exerciseId!]
          for (const id of ids) {
            const m = exerciseById[id].measure
            expect(m === 'reps' ? slot.reps : slot.time, `${slot.id} → ${id} (${m})`).toBeDefined()
          }
        }
    }
  })

  it('challenge tasks reference real exercises', () => {
    for (const c of challengeIdeas)
      for (const task of c.tasks) if (task.exerciseId) expect(exerciseById[task.exerciseId]).toBeDefined()
  })
})
