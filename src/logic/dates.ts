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

export function formatDate(s: ISODate, lang: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(lang === 'bs' ? 'bs-BA' : 'en-GB', opts).format(parseISODate(s))
}
