import type { L10n } from '../i18n/I18nProvider'

export interface Habit {
  id: string
  name: L10n
  target: L10n
}

/** Food & drink habits (App plan › Food & drink). */
export const habits: Habit[] = [
  {
    id: 'noSugaryDrinks',
    name: { en: 'No sugary drinks', bs: 'Bez zaslađenih pića' },
    target: { en: 'Water, tea, coffee without sugar; no juice or soda', bs: 'Voda, čaj, kafa bez šećera; bez sokova' },
  },
  {
    id: 'water',
    name: { en: 'Water', bs: 'Voda' },
    target: { en: '~2 L a day', bs: '~2 L dnevno' },
  },
  {
    id: 'noSnacks',
    name: { en: 'No chips / sweets as snacks', bs: 'Bez čipsa i slatkiša' },
    target: { en: 'Treats planned, e.g. 2× a week', bs: 'Poslastice planirane, npr. 2× sedmično' },
  },
  {
    id: 'onePlate',
    name: { en: 'Normal portion', bs: 'Normalna porcija' },
    target: { en: 'One plate, no seconds', bs: 'Jedan tanjir, bez repete' },
  },
  {
    id: 'kitchenClosed',
    name: { en: 'Kitchen closed', bs: 'Kuhinja zatvorena' },
    target: { en: 'No snacking in the last 2 h before bed', bs: 'Bez grickanja 2 h prije spavanja' },
  },
  {
    id: 'proteinVeg',
    name: { en: 'Protein + veg', bs: 'Proteini + povrće' },
    target: { en: 'Some of each at dinner when possible', bs: 'Malo od oboje uz večeru kad je moguće' },
  },
]

export const swaps: L10n[] = [
  { en: 'Chips → small handful of nuts or popcorn', bs: 'Čips → šaka orašastih plodova ili kokice' },
  { en: 'Juice → water with lemon', bs: 'Sok → voda s limunom' },
  { en: 'Sweets → fruit or yoghurt', bs: 'Slatkiši → voće ili jogurt' },
]
