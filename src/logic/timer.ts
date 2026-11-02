/**
 * Quick timer (countdown or stopwatch) as plain data, so it can be saved and survive
 * a reload. Time is counted from timestamps, never from ticks.
 */

export type TimerMode = 'countdown' | 'stopwatch'

export interface TimerState {
  mode: TimerMode
  /** Countdown length in seconds (kept after a reset, so the last choice is remembered). */
  durationSec: number
  /** When the current run started; null while paused or idle. */
  runningSince: number | null
  /** Time counted before the current run. */
  elapsedMs: number
  /** Countdown reached zero and is ringing until stopped. */
  ringing: boolean
}

export const MIN_SEC = 5
export const MAX_SEC = 3 * 60 * 60

export const initialTimer: TimerState = {
  mode: 'countdown',
  durationSec: 5 * 60,
  runningSince: null,
  elapsedMs: 0,
  ringing: false,
}

const clampSec = (s: number) => Math.min(MAX_SEC, Math.max(MIN_SEC, Math.round(s)))

export function elapsedMs(s: TimerState, now: number): number {
  return s.elapsedMs + (s.runningSince !== null ? Math.max(0, now - s.runningSince) : 0)
}

export function remainingMs(s: TimerState, now: number): number {
  return Math.max(0, s.durationSec * 1000 - elapsedMs(s, now))
}

/** Seconds to show: time left for a countdown (rounded up), time passed for a stopwatch. */
export function displaySec(s: TimerState, now: number): number {
  return s.mode === 'countdown' ? Math.ceil(remainingMs(s, now) / 1000) : Math.floor(elapsedMs(s, now) / 1000)
}

export const isRunning = (s: TimerState) => s.runningSince !== null

/** Started at some point and not reset (running, paused or ringing). */
export const isActive = (s: TimerState) => s.runningSince !== null || s.elapsedMs > 0 || s.ringing

/** A running countdown that has reached zero. */
export function isDue(s: TimerState, now: number): boolean {
  return s.mode === 'countdown' && s.runningSince !== null && remainingMs(s, now) === 0
}

export function start(s: TimerState, now: number): TimerState {
  if (s.runningSince !== null || s.ringing) return s
  return { ...s, runningSince: now }
}

export function pause(s: TimerState, now: number): TimerState {
  if (s.runningSince === null) return s
  return { ...s, elapsedMs: elapsedMs(s, now), runningSince: null }
}

export function reset(s: TimerState): TimerState {
  return { ...s, runningSince: null, elapsedMs: 0, ringing: false }
}

/** Countdown hit zero: stop counting and ring. */
export function finish(s: TimerState): TimerState {
  return { ...s, runningSince: null, elapsedMs: s.durationSec * 1000, ringing: true }
}

/** Only while idle: switching mode mid-run would lose the time. */
export function setMode(s: TimerState, mode: TimerMode): TimerState {
  return isActive(s) ? s : { ...s, mode }
}

export function setDuration(s: TimerState, sec: number): TimerState {
  return isActive(s) ? s : { ...s, durationSec: clampSec(sec) }
}

/**
 * Adds (or with a negative value removes) time from the countdown. While idle it changes
 * the length; while running it moves the end and never goes below a few seconds left.
 */
export function addTime(s: TimerState, sec: number, now: number): TimerState {
  if (!isActive(s)) return setDuration(s, s.durationSec + sec)
  if (s.ringing) {
    if (sec <= 0) return s
    // snooze: ring again in `sec`
    return { ...s, ringing: false, durationSec: sec, elapsedMs: 0, runningSince: now }
  }
  const left = remainingMs(s, now) / 1000
  const change = Math.max(sec, MIN_SEC - left)
  return { ...s, durationSec: Math.min(MAX_SEC, s.durationSec + change) }
}

/** h:mm:ss from an hour up, otherwise m:ss. */
export function formatTimer(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const sec = String(totalSec % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** Reads a saved state, falling back to the default for anything malformed. */
export function parseTimer(raw: unknown): TimerState {
  if (!raw || typeof raw !== 'object') return initialTimer
  const r = raw as Partial<TimerState>
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  return {
    mode: r.mode === 'stopwatch' ? 'stopwatch' : 'countdown',
    durationSec: clampSec(num(r.durationSec, initialTimer.durationSec)),
    runningSince: typeof r.runningSince === 'number' ? r.runningSince : null,
    elapsedMs: Math.max(0, num(r.elapsedMs, 0)),
    ringing: r.ringing === true,
  }
}
