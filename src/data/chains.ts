import type { Chain, ChainId } from './types'

/** Progression ladders, easiest → hardest (Workout program › Progression chains). */
export const chains: Record<ChainId, Chain> = {
  push: {
    id: 'push',
    name: { en: 'Push', bs: 'Guranje' },
    steps: ['incline-pushup', 'pushup', 'tempo-pushup', 'decline-pushup', 'archer-pushup'],
  },
  squat: {
    id: 'squat',
    name: { en: 'Squat', bs: 'Čučanj' },
    steps: ['bodyweight-squat', 'goblet-squat', 'goblet-squat-pause', 'bulgarian-split-squat', 'bulgarian-split-squat-weighted'],
  },
  hinge: {
    id: 'hinge',
    name: { en: 'Hinge', bs: 'Pregib u kuku' },
    steps: ['glute-bridge', 'db-rdl', 'single-leg-glute-bridge', 'single-leg-rdl', 'backpack-rdl'],
  },
  row: {
    id: 'row',
    name: { en: 'Row', bs: 'Veslanje' },
    steps: ['band-row', 'table-row-bent', 'table-row-straight', 'table-row-elevated', 'table-row-one-arm'],
  },
  pullup: {
    id: 'pullup',
    name: { en: 'Pull-up', bs: 'Zgib' },
    steps: ['dead-hang', 'scapular-pull', 'negative-pullup', 'pullup'],
  },
  overhead: {
    id: 'overhead',
    name: { en: 'Overhead', bs: 'Iznad glave' },
    steps: ['seated-db-press', 'standing-db-press', 'pike-pushup', 'pike-pushup-elevated', 'wall-handstand'],
  },
  hamstrings: {
    id: 'hamstrings',
    name: { en: 'Hamstrings', bs: 'Zadnja loža' },
    steps: ['ball-bridge-hold', 'ball-hamstring-curl', 'ball-curl-eccentric', 'single-leg-ball-curl', 'single-leg-ball-curl-pause'],
  },
  core: {
    id: 'core',
    name: { en: 'Core', bs: 'Trup' },
    steps: ['dead-bug', 'plank', 'side-plank', 'ball-rollout', 'ball-stir-the-pot'],
  },
}

/** Starting step per chain, from the "likely start" in the program. */
export const defaultLevels: Record<ChainId, number> = {
  push: 1,
  squat: 1,
  hinge: 1,
  row: 1,
  pullup: 0,
  overhead: 1,
  hamstrings: 1,
  core: 3,
}

/** Where an exercise sits in a ladder, if anywhere. */
export function findInChains(exerciseId: string): { chain: Chain; step: number } | undefined {
  for (const chain of Object.values(chains)) {
    const step = chain.steps.indexOf(exerciseId)
    if (step >= 0) return { chain, step }
  }
  return undefined
}
