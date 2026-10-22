/** Dates are local calendar days as 'YYYY-MM-DD' strings — no time zones in storage. */
export type ISODate = string

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today(): ISODate {
  return toISODate(new Date())
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISODate(s)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** Whole days from a to b (b − a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000)
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(s: ISODate): number {
  return (parseISODate(s).getDay() + 6) % 7
}

/** Monday of the week containing s. */
export function startOfWeek(s: ISODate): ISODate {
  return addDays(s, -weekday(s))
}

export function monthKey(s: ISODate): string {
  return s.slice(0, 7)
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** 1-based day of the month. */
export function dayOfMonth(s: ISODate): number {
  return Number(s.slice(8, 10))
}

const names = {
  en: {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  bs: {
    days: ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'],
    months: ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar'],
  },
}

// Own names instead of Intl: not every browser ships Bosnian locale data.
const pick = (lang: string) => (lang === 'bs' ? names.bs : names.en)

/** "Wed 21 Oct" / "Sri, 21. okt" */
export function formatDay(s: ISODate, lang: string): string {
  const n = pick(lang)
  const day = n.days[weekday(s)]
  const month = n.months[Number(s.slice(5, 7)) - 1].slice(0, 3)
  return lang === 'bs' ? `${day}, ${dayOfMonth(s)}. ${month}` : `${day} ${dayOfMonth(s)} ${month}`
}

/** Short weekday name, Monday = 0. */
export function weekdayName(index: number, lang: string): string {
  return pick(lang).days[index]
}

/** "October" / "Oktobar" */
export function formatMonth(s: ISODate, lang: string): string {
  const m = pick(lang).months[Number(s.slice(5, 7)) - 1]
  return m[0].toUpperCase() + m.slice(1)
}

/** 7,000 / 7.000 — thousands separator per language. */
export function formatNumber(n: number, lang: string): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'bs' ? '.' : ',')
}

/** "22 Oct" / "22. okt" — compact date for chart axes. */
export function formatShort(s: ISODate, lang: string): string {
  const d = Number(s.slice(8, 10))
  const m = pick(lang).months[Number(s.slice(5, 7)) - 1].slice(0, 3)
  return lang === 'bs' ? `${d}. ${m}` : `${d} ${m[0].toUpperCase()}${m.slice(1)}`
}

const longDays = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  bs: ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'],
}

/** Full weekday name, Monday = 0. */
export function weekdayLong(index: number, lang: string): string {
  return (lang === 'bs' ? longDays.bs : longDays.en)[index]
}
