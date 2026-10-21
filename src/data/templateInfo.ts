import type { Template } from './templates'

/** How many items a session has, and whether they're exercises or rounds — for summary lines. */
export function templateSize(t: Template): { n: number; unit: 'items' | 'rounds' } | null {
  switch (t.kind) {
    case 'strength':
      return { n: t.pairs.length * 2, unit: 'items' }
    case 'flow':
      return { n: t.items.length, unit: 'items' }
    case 'complex':
      return { n: t.items.length, unit: 'items' }
    case 'rounds':
      return { n: t.rounds, unit: 'rounds' }
    case 'walk':
      return null
  }
}
