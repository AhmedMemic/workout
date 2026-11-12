import type { L10n } from '../i18n/I18nProvider'
import type { ChainId } from './types'

export interface Range {
  min: number
  max: number
}

/** A strength slot uses `reps` or `time` depending on the resolved exercise's measure. */
export interface Slot {
  id: string
  /** Fixed exercise, or the current step of a chain. */
  exerciseId?: string
  chain?: ChainId
  reps?: Range
  time?: Range
  note?: L10n
}

/** One item in a guided flow (warm-up, desk reset, cool-down). */
export interface FlowItem {
  exerciseId: string
  reps?: number
  seconds?: number
  perSide?: boolean
}

export type TemplateId =
  | 'strengthA'
  | 'strengthB'
  | 'strengthC'
  | 'warmUp'
  | 'warmUpB'
  | 'warmUpC'
  | 'coolDown'
  | 'coolDownB'
  | 'coolDownC'
  | 'deskReset'
  | 'deskResetShort'
  | 'gripFinisher'
  | 'boxingRounds'
  | 'lowImpactCircuit'
  | 'dumbbellComplex'
  | 'walk'
  | 'longWalk'

interface Base {
  id: TemplateId
  name: L10n
  description: L10n
  /** Rough duration in minutes, for the Today card. */
  minutes: number
}

export interface StrengthTemplate extends Base {
  kind: 'strength'
  /** Pairs done back to back (1a + 1b), rest after each pair. */
  pairs: [Slot, Slot][]
  restSec: number
  /** Warm-up and cool-down matched to the day's main lifts. */
  warmUp: TemplateId
  coolDown: TemplateId
}

export interface FlowTemplate extends Base {
  kind: 'flow'
  items: FlowItem[]
}

export interface RoundsTemplate extends Base {
  kind: 'rounds'
  rounds: number
  workSec: number
  restSec: number
  /** Focus for each round (boxing) or the exercise rotation (circuit). */
  roundFocus?: L10n[]
  exerciseIds: string[]
}

export interface ComplexTemplate extends Base {
  kind: 'complex'
  rounds: number
  restSec: number
  items: { exerciseId: string; reps: number }[]
}

export interface WalkTemplate extends Base {
  kind: 'walk'
}

export type Template = StrengthTemplate | FlowTemplate | RoundsTemplate | ComplexTemplate | WalkTemplate

const reps = (min: number, max: number): Range => ({ min, max })

export const templates: Record<TemplateId, Template> = {
  strengthA: {
    id: 'strengthA',
    kind: 'strength',
    name: { en: 'Strength A', bs: 'Snaga A' },
    description: { en: 'Squat + push', bs: 'Čučanj + guranje' },
    minutes: 40,
    restSec: 75,
    warmUp: 'warmUp',
    coolDown: 'coolDown',
    pairs: [
      [
        { id: 'A1a', chain: 'squat', reps: reps(12, 20) },
        { id: 'A1b', exerciseId: 'one-arm-db-row', reps: reps(12, 20) },
      ],
      [
        { id: 'A2a', chain: 'push', reps: reps(6, 15) },
        { id: 'A2b', chain: 'hinge', reps: reps(12, 20) },
      ],
      [
        { id: 'A3a', chain: 'overhead', reps: reps(10, 15), time: reps(15, 30) },
        { id: 'A3b', exerciseId: 'dead-bug', reps: reps(8, 8) },
      ],
    ],
  },
  strengthB: {
    id: 'strengthB',
    kind: 'strength',
    name: { en: 'Strength B', bs: 'Snaga B' },
    description: { en: 'Hinge + pull', bs: 'Pregib + povlačenje' },
    minutes: 40,
    restSec: 75,
    warmUp: 'warmUpB',
    coolDown: 'coolDownB',
    pairs: [
      [
        { id: 'B1a', chain: 'lunge', reps: reps(8, 15) },
        { id: 'B1b', chain: 'row', reps: reps(6, 15) },
      ],
      [
        { id: 'B2a', exerciseId: 'glute-bridge', reps: reps(15, 25) },
        { id: 'B2b', exerciseId: 'floor-press', reps: reps(12, 20) },
      ],
      [
        { id: 'B3a', chain: 'hamstrings', reps: reps(8, 15), time: reps(20, 40) },
        { id: 'B3b', exerciseId: 'side-plank', time: reps(20, 40) },
      ],
    ],
  },
  strengthC: {
    id: 'strengthC',
    kind: 'strength',
    name: { en: 'Strength C', bs: 'Snaga C' },
    description: { en: 'Single-leg + mix', bs: 'Jedna noga + mix' },
    minutes: 40,
    restSec: 75,
    warmUp: 'warmUpC',
    coolDown: 'coolDownC',
    pairs: [
      [
        { id: 'C1a', chain: 'lunge', reps: reps(8, 15) },
        { id: 'C1b', exerciseId: 'bent-over-row', reps: reps(15, 20) },
      ],
      [
        { id: 'C2a', exerciseId: 'tempo-pushup', reps: reps(5, 12) },
        { id: 'C2b', chain: 'singleLegHinge', reps: reps(8, 12) },
      ],
      [
        { id: 'C3a', exerciseId: 'overhead-triceps-extension', reps: reps(10, 15) },
        { id: 'C3b', chain: 'core', reps: reps(6, 10), time: reps(30, 60) },
      ],
    ],
  },

  /*
   * Warm-ups follow RAMP (raise the pulse, activate and mobilise, potentiate): 5–10 min of
   * dynamic moves that rehearse the day's lifts, no long static holds before lifting.
   * Each has a balance drill. Cool-downs are static stretches for the muscles just
   * worked, ~30–60 s per muscle (ACSM), done while warm.
   */
  warmUp: {
    id: 'warmUp',
    kind: 'flow',
    name: { en: 'Warm-up · squat & push', bs: 'Zagrijavanje · čučanj i guranje' },
    description: { en: 'Ankles, hips and shoulders for squats and push-ups', bs: 'Gležnjevi, kukovi i ramena za čučnjeve i sklekove' },
    minutes: 7,
    items: [
      { exerciseId: 'march-in-place', seconds: 90 },
      { exerciseId: 'ankle-rock', reps: 8 },
      { exerciseId: 'cat-cow', reps: 6 },
      { exerciseId: 'worlds-greatest-stretch', reps: 3, perSide: true },
      { exerciseId: 'glute-bridge', reps: 10 },
      { exerciseId: 'arm-circles', reps: 10 },
      { exerciseId: 'bodyweight-squat', reps: 8 },
      { exerciseId: 'single-leg-stand', seconds: 30, perSide: true },
      { exerciseId: 'incline-pushup', reps: 6 },
    ],
  },
  warmUpB: {
    id: 'warmUpB',
    kind: 'flow',
    name: { en: 'Warm-up · hinge & pull', bs: 'Zagrijavanje · pregib i povlačenje' },
    description: { en: 'Hamstrings, hips and upper back for hinges and rows', bs: 'Zadnja loža, kukovi i gornja leđa za pregibe i veslanja' },
    minutes: 7,
    items: [
      { exerciseId: 'march-in-place', seconds: 90 },
      { exerciseId: 'cat-cow', reps: 8 },
      { exerciseId: 'hip-hinge-drill', reps: 10 },
      { exerciseId: 'leg-swing', reps: 10 },
      { exerciseId: 'thread-the-needle', reps: 5, perSide: true },
      { exerciseId: 'glute-bridge', reps: 10 },
      { exerciseId: 'wall-angel', reps: 8 },
      { exerciseId: 'tandem-stance', seconds: 30, perSide: true },
      { exerciseId: 'split-squat', reps: 5 },
    ],
  },
  warmUpC: {
    id: 'warmUpC',
    kind: 'flow',
    name: { en: 'Warm-up · single leg', bs: 'Zagrijavanje · jedna noga' },
    description: { en: 'Hips, ankles and balance for single-leg work', bs: 'Kukovi, gležnjevi i ravnoteža za rad na jednoj nozi' },
    minutes: 7,
    items: [
      { exerciseId: 'march-in-place', seconds: 90 },
      { exerciseId: 'hip-90-90', reps: 6 },
      { exerciseId: 'leg-swing', reps: 10 },
      { exerciseId: 'calf-raise', reps: 12 },
      { exerciseId: 'hip-hinge-drill', reps: 8 },
      { exerciseId: 'split-squat', reps: 5 },
      { exerciseId: 'single-leg-stand', seconds: 30, perSide: true },
      { exerciseId: 'arm-circles', reps: 10 },
      { exerciseId: 'incline-pushup', reps: 6 },
    ],
  },
  coolDown: {
    id: 'coolDown',
    kind: 'flow',
    name: { en: 'Cool-down · legs & chest', bs: 'Hlađenje · noge i prsa' },
    description: { en: 'Stretch and breathe', bs: 'Istezanje i disanje' },
    minutes: 5,
    items: [
      { exerciseId: 'hip-flexor-stretch', seconds: 45, perSide: true },
      { exerciseId: 'quad-stretch', seconds: 30 },
      { exerciseId: 'doorway-chest-stretch', seconds: 45 },
      { exerciseId: 'childs-pose', seconds: 45 },
      { exerciseId: 'breathing', seconds: 60 },
    ],
  },
  coolDownB: {
    id: 'coolDownB',
    kind: 'flow',
    name: { en: 'Cool-down · hips & back', bs: 'Hlađenje · kukovi i leđa' },
    description: { en: 'Stretch and breathe', bs: 'Istezanje i disanje' },
    minutes: 6,
    items: [
      { exerciseId: 'hamstring-stretch', seconds: 45, perSide: true },
      { exerciseId: 'figure-four-stretch', seconds: 45 },
      { exerciseId: 'shoulder-stretch', seconds: 30 },
      { exerciseId: 'childs-pose', seconds: 45 },
      { exerciseId: 'breathing', seconds: 60 },
    ],
  },
  coolDownC: {
    id: 'coolDownC',
    kind: 'flow',
    name: { en: 'Cool-down · calves & hips', bs: 'Hlađenje · listovi i kukovi' },
    description: { en: 'Stretch and breathe', bs: 'Istezanje i disanje' },
    minutes: 6,
    items: [
      { exerciseId: 'calf-stretch', seconds: 30 },
      { exerciseId: 'hip-flexor-stretch', seconds: 45, perSide: true },
      { exerciseId: 'figure-four-stretch', seconds: 30 },
      { exerciseId: 'doorway-chest-stretch', seconds: 45 },
      { exerciseId: 'breathing', seconds: 60 },
    ],
  },
  gripFinisher: {
    id: 'gripFinisher',
    kind: 'flow',
    name: { en: 'Grip finisher', bs: 'Završnica za stisak' },
    description: { en: 'Hands and forearms', bs: 'Šake i podlaktice' },
    minutes: 3,
    items: [
      { exerciseId: 'hand-gripper', reps: 15, perSide: true },
      { exerciseId: 'finger-trainer', reps: 15, perSide: true },
      { exerciseId: 'finger-extension', reps: 20, perSide: true },
    ],
  },
  deskReset: {
    id: 'deskReset',
    kind: 'flow',
    name: { en: 'Desk reset', bs: 'Reset od sjedenja' },
    description: { en: 'Hips, upper back, chest, neck, balance', bs: 'Kukovi, gornja leđa, prsa, vrat, ravnoteža' },
    minutes: 14,
    items: [
      { exerciseId: 'cat-cow', reps: 8 },
      { exerciseId: 'thread-the-needle', reps: 6, perSide: true },
      { exerciseId: 'hip-flexor-stretch', seconds: 45, perSide: true },
      { exerciseId: 'hip-90-90', reps: 8 },
      { exerciseId: 'deep-squat-hold', seconds: 45 },
      { exerciseId: 'hamstring-stretch', seconds: 45, perSide: true },
      { exerciseId: 'doorway-chest-stretch', seconds: 45, perSide: true },
      { exerciseId: 'chin-tuck', reps: 10 },
      { exerciseId: 'wall-angel', reps: 8 },
      { exerciseId: 'ball-back-extension', reps: 10 },
      { exerciseId: 'tandem-stance', seconds: 30, perSide: true },
      { exerciseId: 'single-leg-stand', seconds: 30, perSide: true },
      { exerciseId: 'childs-pose', seconds: 60 },
    ],
  },
  deskResetShort: {
    id: 'deskResetShort',
    kind: 'flow',
    name: { en: 'Desk reset (short)', bs: 'Reset od sjedenja (kratki)' },
    description: { en: '6 minutes for busy days', bs: '6 minuta za zauzete dane' },
    minutes: 6,
    items: [
      { exerciseId: 'cat-cow', reps: 8 },
      { exerciseId: 'hip-flexor-stretch', seconds: 45, perSide: true },
      { exerciseId: 'doorway-chest-stretch', seconds: 45, perSide: true },
      { exerciseId: 'chin-tuck', reps: 10 },
      { exerciseId: 'wall-angel', reps: 8 },
      { exerciseId: 'single-leg-stand', seconds: 30, perSide: true },
    ],
  },

  boxingRounds: {
    id: 'boxingRounds',
    kind: 'rounds',
    name: { en: 'Boxing rounds', bs: 'Bokserske runde' },
    description: { en: '6 × 3 min shadow boxing', bs: '6 × 3 min boks u sjeni' },
    minutes: 24,
    rounds: 6,
    workSec: 180,
    restSec: 60,
    exerciseIds: ['shadow-boxing'],
    roundFocus: [
      { en: 'Jab-cross', bs: 'Jab-kros (direkt + kros)' },
      { en: 'Add hooks', bs: 'Dodaj krošee' },
      { en: 'Slips and ducks under the rope', bs: 'Izmicanje i saginjanje ispod užeta' },
      { en: 'Body shots + squats', bs: 'Udarci u tijelo + čučnjevi' },
      { en: 'Weaving — Dempsey roll', bs: 'Njihanje — Dempsey roll' },
      { en: 'Everything, fastest pace', bs: 'Sve zajedno, najbrži tempo' },
    ],
  },
  lowImpactCircuit: {
    id: 'lowImpactCircuit',
    kind: 'rounds',
    name: { en: 'Low-impact circuit', bs: 'Tihi kružni trening' },
    description: { en: '40 s work / 20 s rest, 4 rounds', bs: '40 s rad / 20 s odmor, 4 kruga' },
    minutes: 20,
    rounds: 4,
    workSec: 40,
    restSec: 20,
    exerciseIds: ['squat-calf-raise', 'towel-mountain-climber', 'lateral-lunge-step', 'plank-shoulder-tap', 'high-knee-march'],
  },
  dumbbellComplex: {
    id: 'dumbbellComplex',
    kind: 'complex',
    name: { en: 'Dumbbell complex', bs: 'Kompleks s bučicama' },
    description: { en: '5 rounds with 2 × 5 kg, no putting them down', bs: '5 krugova s 2 × 5 kg, bez spuštanja' },
    minutes: 18,
    rounds: 5,
    restSec: 60,
    items: [
      { exerciseId: 'squat-to-press', reps: 8 },
      { exerciseId: 'bent-over-row', reps: 8 },
      { exerciseId: 'db-rdl', reps: 8 },
      { exerciseId: 'reverse-lunge', reps: 8 },
    ],
  },
  walk: {
    id: 'walk',
    kind: 'walk',
    name: { en: 'Walk', bs: 'Šetnja' },
    description: { en: '30 min brisk walk outside', bs: '30 min brze šetnje vani' },
    minutes: 30,
  },
  longWalk: {
    id: 'longWalk',
    kind: 'walk',
    name: { en: 'Long walk', bs: 'Duga šetnja' },
    description: { en: '45–60 min, good with family', bs: '45–60 min, idealno s porodicom' },
    minutes: 50,
  },
}

export const strengthTemplateIds = ['strengthA', 'strengthB', 'strengthC'] as const
