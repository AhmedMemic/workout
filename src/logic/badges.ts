import type { L10n } from '../i18n/I18nProvider'

export interface BadgeStats {
  workouts: number
  deskResets: number
  bestStreak: number
  levelUps: number
  fullChallengeMonths: number
  /** kg down from the first weigh-in (7-day average), 0 if up. */
  weightLost: number
  tests: number
  goalsReached: number
}

export interface Badge {
  id: string
  /** Short text inside the medal. */
  glyph: string
  name: L10n
  how: L10n
  stat: keyof BadgeStats
  need: number
}

/** Milestones, in the order they're shown. Names lean on boxing (Hajime no Ippo). */
export const badges: Badge[] = [
  { id: 'first-bell', glyph: '1', stat: 'workouts', need: 1, name: { en: 'First bell', bs: 'Prvo zvono' }, how: { en: 'Finish your first workout', bs: 'Završi prvi trening' } },
  { id: 'workouts-10', glyph: '10', stat: 'workouts', need: 10, name: { en: 'Ten rounds', bs: 'Deset rundi' }, how: { en: 'Finish 10 workouts', bs: 'Završi 10 treninga' } },
  { id: 'workouts-25', glyph: '25', stat: 'workouts', need: 25, name: { en: 'Contender', bs: 'Izazivač' }, how: { en: 'Finish 25 workouts', bs: 'Završi 25 treninga' } },
  { id: 'workouts-50', glyph: '50', stat: 'workouts', need: 50, name: { en: 'Title fight', bs: 'Borba za titulu' }, how: { en: 'Finish 50 workouts', bs: 'Završi 50 treninga' } },
  { id: 'workouts-100', glyph: '100', stat: 'workouts', need: 100, name: { en: 'Champion', bs: 'Šampion' }, how: { en: 'Finish 100 workouts', bs: 'Završi 100 treninga' } },
  { id: 'streak-3', glyph: '3d', stat: 'bestStreak', need: 3, name: { en: 'Roadwork', bs: 'Jutarnje trčanje' }, how: { en: 'Reach a 3-day streak', bs: 'Postigni niz od 3 dana' } },
  { id: 'streak-7', glyph: '7d', stat: 'bestStreak', need: 7, name: { en: 'One week strong', bs: 'Sedmica snage' }, how: { en: 'Reach a 7-day streak', bs: 'Postigni niz od 7 dana' } },
  { id: 'streak-14', glyph: '14d', stat: 'bestStreak', need: 14, name: { en: 'Never give up', bs: 'Nikad ne odustaj' }, how: { en: 'Reach a 14-day streak', bs: 'Postigni niz od 14 dana' } },
  { id: 'streak-30', glyph: '30d', stat: 'bestStreak', need: 30, name: { en: 'Iron month', bs: 'Željezni mjesec' }, how: { en: 'Reach a 30-day streak', bs: 'Postigni niz od 30 dana' } },
  { id: 'level-up', glyph: '↑', stat: 'levelUps', need: 1, name: { en: 'Level up', bs: 'Novi nivo' }, how: { en: 'Move up a progression ladder', bs: 'Pređi na težu vježbu u ljestvici' } },
  { id: 'level-up-5', glyph: '↑5', stat: 'levelUps', need: 5, name: { en: 'Dempsey roll', bs: 'Dempsey roll' }, how: { en: 'Move up 5 ladder steps in total', bs: 'Pređi ukupno 5 koraka u ljestvicama' } },
  { id: 'desk-10', glyph: '10×', stat: 'deskResets', need: 10, name: { en: 'Desk warrior', bs: 'Ratnik za stolom' }, how: { en: 'Do the desk reset 10 times', bs: 'Uradi reset od sjedenja 10 puta' } },
  { id: 'challenge-month', glyph: '✓', stat: 'fullChallengeMonths', need: 1, name: { en: 'Full month', bs: 'Cijeli mjesec' }, how: { en: 'Complete every day of a monthly challenge', bs: 'Završi svaki dan mjesečnog izazova' } },
  { id: 'weight-2', glyph: '−2', stat: 'weightLost', need: 2, name: { en: 'Making weight', bs: 'Skidanje kila' }, how: { en: 'Lose 2 kg (7-day average)', bs: 'Skini 2 kg (prosjek 7 dana)' } },
  { id: 'weight-5', glyph: '−5', stat: 'weightLost', need: 5, name: { en: 'Lighter on the feet', bs: 'Lakši na nogama' }, how: { en: 'Lose 5 kg', bs: 'Skini 5 kg' } },
  { id: 'weight-10', glyph: '−10', stat: 'weightLost', need: 10, name: { en: 'New weight class', bs: 'Nova kategorija' }, how: { en: 'Lose 10 kg', bs: 'Skini 10 kg' } },
  { id: 'baseline', glyph: 'T1', stat: 'tests', need: 1, name: { en: 'Weigh-in day', bs: 'Dan vaganja' }, how: { en: 'Do your baseline tests', bs: 'Uradi početne testove' } },
  { id: 'retest', glyph: 'T2', stat: 'tests', need: 2, name: { en: 'Rematch', bs: 'Revanš' }, how: { en: 'Do your first re-test', bs: 'Uradi prvi ponovni test' } },
  { id: 'goal', glyph: '★', stat: 'goalsReached', need: 1, name: { en: 'Goal!', bs: 'Cilj!' }, how: { en: 'Reach one of your goals', bs: 'Ostvari jedan od svojih ciljeva' } },
]

export function isEarned(badge: Badge, stats: BadgeStats): boolean {
  return stats[badge.stat] >= badge.need
}
