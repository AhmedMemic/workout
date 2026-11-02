/**
 * Standing desk: a work session switches between sitting and standing. Standing time is
 * counted from timestamps and added to the day's log when you sit down or stop.
 */

export type DeskMode = 'off' | 'sitting' | 'standing'

export interface DeskState {
  mode: DeskMode
  /** When the current mode began. */
  since: number
  /** A switch reminder was already given for the current mode. */
  reminded: boolean
}

export const deskOff: DeskState = { mode: 'off', since: 0, reminded: false }

/** Minutes of standing finished by leaving the current mode at `now`. */
export function standingMinutes(s: DeskState, now: number): number {
  return s.mode === 'standing' ? Math.max(0, Math.round((now - s.since) / 60_000)) : 0
}

/** Moves to `mode`; returns the new state and the standing minutes to log. */
export function switchMode(s: DeskState, mode: DeskMode, now: number): { state: DeskState; addMin: number } {
  if (mode === s.mode) return { state: s, addMin: 0 }
  const addMin = standingMinutes(s, now)
  return { state: mode === 'off' ? deskOff : { mode, since: now, reminded: false }, addMin }
}

/** Time to switch: the current mode has lasted its interval and no reminder was given yet. */
export function reminderDue(s: DeskState, now: number, standMin: number, sitMin: number): boolean {
  if (s.mode === 'off' || s.reminded) return false
  const limit = (s.mode === 'standing' ? standMin : sitMin) * 60_000
  return now - s.since >= limit
}

/** Reads a saved state, falling back to "off" for anything malformed. */
export function parseDesk(raw: unknown): DeskState {
  if (!raw || typeof raw !== 'object') return deskOff
  const r = raw as Partial<DeskState>
  if ((r.mode !== 'sitting' && r.mode !== 'standing') || typeof r.since !== 'number') return deskOff
  return { mode: r.mode, since: r.since, reminded: r.reminded === true }
}
