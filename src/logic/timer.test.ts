import { describe, expect, it } from 'vitest'
import {
  addTime,
  displaySec,
  finish,
  formatTimer,
  initialTimer,
  isActive,
  isDue,
  parseTimer,
  pause,
  reset,
  setDuration,
  setMode,
  start,
  type TimerState,
} from './timer'

const t0 = 1_000_000
const countdown = (sec: number): TimerState => ({ ...initialTimer, durationSec: sec })

describe('quick timer', () => {
  it('counts down from timestamps and is due at zero', () => {
    const s = start(countdown(60), t0)
    expect(displaySec(s, t0)).toBe(60)
    expect(displaySec(s, t0 + 500)).toBe(60) // rounds up
    expect(displaySec(s, t0 + 59_001)).toBe(1)
    expect(isDue(s, t0 + 59_999)).toBe(false)
    expect(isDue(s, t0 + 60_000)).toBe(true)
    expect(displaySec(s, t0 + 90_000)).toBe(0)
  })

  it('pauses and resumes without losing time', () => {
    let s = start(countdown(60), t0)
    s = pause(s, t0 + 20_000)
    expect(displaySec(s, t0 + 100_000)).toBe(40)
    s = start(s, t0 + 100_000)
    expect(displaySec(s, t0 + 110_000)).toBe(30)
  })

  it('stopwatch counts up', () => {
    const s = start(setMode(initialTimer, 'stopwatch'), t0)
    expect(displaySec(s, t0 + 3_999)).toBe(3)
    expect(isDue(s, t0 + 10 * 3600_000)).toBe(false)
  })

  it('finish rings and reset keeps the chosen length', () => {
    const s = finish(start(countdown(90), t0))
    expect(s.ringing).toBe(true)
    expect(isActive(s)).toBe(true)
    expect(start(s, t0)).toBe(s) // can't start while ringing
    const r = reset(s)
    expect(r).toMatchObject({ ringing: false, elapsedMs: 0, runningSince: null, durationSec: 90 })
  })

  it('mode and length only change while idle', () => {
    const running = start(countdown(60), t0)
    expect(setMode(running, 'stopwatch').mode).toBe('countdown')
    expect(setDuration(running, 600).durationSec).toBe(60)
    expect(setDuration(initialTimer, 1).durationSec).toBe(5)
  })

  it('adding time while idle changes the length, while running moves the end', () => {
    expect(addTime(countdown(60), 60, t0).durationSec).toBe(120)
    expect(addTime(countdown(30), -60, t0).durationSec).toBe(5)
    const s = addTime(start(countdown(60), t0), 60, t0 + 10_000)
    expect(displaySec(s, t0 + 10_000)).toBe(110)
    // removing more than is left still leaves a few seconds
    const cut = addTime(start(countdown(60), t0), -60, t0 + 50_000)
    expect(displaySec(cut, t0 + 50_000)).toBe(5)
  })

  it('adding time while ringing snoozes', () => {
    const s = addTime(finish(start(countdown(60), t0)), 60, t0 + 70_000)
    expect(s.ringing).toBe(false)
    expect(displaySec(s, t0 + 70_000)).toBe(60)
    expect(isDue(s, t0 + 130_000)).toBe(true)
  })

  it('formats minutes and hours', () => {
    expect(formatTimer(0)).toBe('0:00')
    expect(formatTimer(65)).toBe('1:05')
    expect(formatTimer(3725)).toBe('1:02:05')
  })

  it('parses saved state defensively', () => {
    expect(parseTimer(null)).toEqual(initialTimer)
    expect(parseTimer({ mode: 'x', durationSec: 'a', elapsedMs: -5 })).toEqual(initialTimer)
    const s = start(countdown(120), t0)
    expect(parseTimer(JSON.parse(JSON.stringify(s)))).toEqual(s)
  })
})
