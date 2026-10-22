import type { L10n } from '../i18n/I18nProvider'

export type Equipment =
  | 'bodyweight'
  | 'dumbbell5'
  | 'dumbbell7'
  | 'ball'
  | 'band'
  | 'chair'
  | 'backpack'
  | 'towel'
  | 'broomstick'
  | 'wall'
  | 'doorframe'
  | 'pullupBar'
  | 'gripper'
  | 'fingerTrainer'
  | 'fingerBand'
  | 'mat'

export type Muscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'triceps'
  | 'biceps'
  | 'quads'
  | 'glutes'
  | 'hamstrings'
  | 'calves'
  | 'core'
  | 'hips'
  | 'neck'
  | 'forearms'
  | 'fullBody'

export type ExerciseKind = 'strength' | 'mobility' | 'cardio' | 'grip'

export interface Exercise {
  id: string
  name: L10n
  kind: ExerciseKind
  muscles: Muscle[]
  equipment: Equipment[]
  /** Short how-to, one line per step. */
  steps: { en: string[]; bs: string[] }
  /** Measured in reps, or held / done for time. */
  measure: 'reps' | 'time'
  /** Done per side (reps or seconds are per side). */
  perSide?: boolean
  /** Per-side reps done alternating left/right in one go, so the player doesn't split it into two sides. */
  alternating?: boolean
  /** Search phrase for the YouTube how-to link. */
  youtube: string
}

export type ChainId = 'push' | 'squat' | 'hinge' | 'row' | 'pullup' | 'overhead' | 'hamstrings' | 'core'

export interface Chain {
  id: ChainId
  name: L10n
  /** Exercise ids from easiest to hardest. */
  steps: string[]
}
