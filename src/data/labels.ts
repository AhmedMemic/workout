import type { L10n } from '../i18n/I18nProvider'
import type { Equipment, ExerciseKind, Muscle } from './types'

export const muscleLabels: Record<Muscle, L10n> = {
  chest: { en: 'Chest', bs: 'Prsa' },
  back: { en: 'Back', bs: 'Leđa' },
  shoulders: { en: 'Shoulders', bs: 'Ramena' },
  triceps: { en: 'Triceps', bs: 'Triceps' },
  biceps: { en: 'Biceps', bs: 'Biceps' },
  quads: { en: 'Quads', bs: 'Kvadricepsi' },
  glutes: { en: 'Glutes', bs: 'Gluteusi' },
  hamstrings: { en: 'Hamstrings', bs: 'Zadnja loža' },
  calves: { en: 'Calves', bs: 'Listovi' },
  core: { en: 'Core', bs: 'Trup' },
  hips: { en: 'Hips', bs: 'Kukovi' },
  neck: { en: 'Neck', bs: 'Vrat' },
  forearms: { en: 'Forearms', bs: 'Podlaktice' },
  fullBody: { en: 'Full body', bs: 'Cijelo tijelo' },
}

export const equipmentLabels: Record<Equipment, L10n> = {
  bodyweight: { en: 'Bodyweight', bs: 'Vlastita težina' },
  dumbbell5: { en: '2 × 5 kg dumbbells', bs: 'Bučice 2 × 5 kg' },
  dumbbell7: { en: '7 kg dumbbell', bs: 'Bučica 7 kg' },
  ball: { en: 'Stability ball', bs: 'Pilates lopta' },
  band: { en: 'Pedal band', bs: 'Guma s pedalom' },
  chair: { en: 'Chair', bs: 'Stolica' },
  backpack: { en: 'Backpack', bs: 'Ranac' },
  towel: { en: 'Towels', bs: 'Peškiri' },
  broomstick: { en: 'Broomstick', bs: 'Drška metle' },
  wall: { en: 'Wall', bs: 'Zid' },
  doorframe: { en: 'Doorframe', bs: 'Štok vrata' },
  pullupBar: { en: 'Pull-up bar', bs: 'Šipka za zgibove' },
  gripper: { en: 'Hand gripper', bs: 'Sprava za stisak' },
  fingerTrainer: { en: 'Finger strengthener', bs: 'Sprava za prste' },
  fingerBand: { en: 'Finger band', bs: 'Guma za prste' },
  mat: { en: 'Mat', bs: 'Prostirka' },
}

export const kindLabels: Record<ExerciseKind, L10n> = {
  strength: { en: 'Strength', bs: 'Snaga' },
  mobility: { en: 'Mobility', bs: 'Mobilnost' },
  cardio: { en: 'Cardio', bs: 'Kardio' },
  grip: { en: 'Grip', bs: 'Stisak' },
}
