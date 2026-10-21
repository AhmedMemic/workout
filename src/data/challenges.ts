import type { L10n } from '../i18n/I18nProvider'

export type TaskUnit = 'reps' | 'seconds' | 'minutes' | 'check'

export interface ChallengeTask {
  id: string
  name: L10n
  unit: TaskUnit
  /** Target on day 1. */
  target: number
  /** Target on the last day; targets rise evenly in between. */
  rampTo?: number
  exerciseId?: string
}

export interface ChallengeIdea {
  id: string
  name: L10n
  tasks: ChallengeTask[]
}

/** The first monthly challenge (App plan › Monthly challenge). Sets may be split. */
export const starterChallenge: ChallengeIdea = {
  id: 'starter',
  name: { en: 'Starter challenge', bs: 'Početni izazov' },
  tasks: [
    { id: 'pushups', name: { en: 'Push-ups', bs: 'Sklekovi' }, unit: 'reps', target: 10, exerciseId: 'pushup' },
    { id: 'plank', name: { en: 'Plank', bs: 'Plank' }, unit: 'seconds', target: 30, rampTo: 60, exerciseId: 'plank' },
    { id: 'situps', name: { en: 'Sit-ups', bs: 'Trbušnjaci' }, unit: 'reps', target: 20, exerciseId: 'situp' },
  ],
}

export const challengeIdeas: ChallengeIdea[] = [
  starterChallenge,
  {
    id: 'pushupMonth',
    name: { en: 'Push-up month', bs: 'Mjesec sklekova' },
    tasks: [{ id: 'pushups', name: { en: 'Push-ups', bs: 'Sklekovi' }, unit: 'reps', target: 10, rampTo: 30, exerciseId: 'pushup' }],
  },
  {
    id: 'plankMonth',
    name: { en: 'Plank month', bs: 'Mjesec planka' },
    tasks: [{ id: 'plank', name: { en: 'Plank', bs: 'Plank' }, unit: 'seconds', target: 30, rampTo: 120, exerciseId: 'plank' }],
  },
  {
    id: 'squatMonth',
    name: { en: 'Squat month', bs: 'Mjesec čučnjeva' },
    tasks: [{ id: 'squats', name: { en: 'Squats', bs: 'Čučnjevi' }, unit: 'reps', target: 20, rampTo: 50, exerciseId: 'bodyweight-squat' }],
  },
  {
    id: 'toeTouchMonth',
    name: { en: 'Toe-touch month', bs: 'Mjesec dodira prstiju' },
    tasks: [
      { id: 'hamstrings', name: { en: 'Hamstring stretch', bs: 'Istezanje zadnje lože' }, unit: 'seconds', target: 60, exerciseId: 'hamstring-stretch' },
      { id: 'squatHold', name: { en: 'Deep squat hold', bs: 'Duboki čučanj' }, unit: 'seconds', target: 45, rampTo: 90, exerciseId: 'deep-squat-hold' },
    ],
  },
  {
    id: 'walkMonth',
    name: { en: 'Walk month', bs: 'Mjesec šetnje' },
    tasks: [{ id: 'walk', name: { en: 'Walk', bs: 'Šetnja' }, unit: 'minutes', target: 20, exerciseId: 'brisk-walk' }],
  },
  {
    id: 'noJuiceMonth',
    name: { en: 'No-juice month', bs: 'Mjesec bez sokova' },
    tasks: [{ id: 'noJuice', name: { en: 'No juice or soda', bs: 'Bez sokova' }, unit: 'check', target: 1 }],
  },
]
