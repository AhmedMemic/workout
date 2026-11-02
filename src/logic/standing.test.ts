import { describe, expect, it } from 'vitest'
import { deskOff, parseDesk, reminderDue, standingMinutes, switchMode } from './standing'

const t0 = 1_000_000_000
const min = 60_000

describe('standing desk', () => {
  it('logs standing minutes when you sit down or stop, not sitting time', () => {
    const standing = switchMode(deskOff, 'standing', t0)
    expect(standing.addMin).toBe(0)
    const sat = switchMode(standing.state, 'sitting', t0 + 31 * min)
    expect(sat.addMin).toBe(31)
    expect(sat.state).toEqual({ mode: 'sitting', since: t0 + 31 * min, reminded: false })
    expect(switchMode(sat.state, 'off', t0 + 90 * min)).toEqual({ state: deskOff, addMin: 0 })
    expect(switchMode(standing.state, 'off', t0 + 20 * min).addMin).toBe(20)
  })

  it('switching to the same mode changes nothing', () => {
    const s = switchMode(deskOff, 'standing', t0).state
    expect(switchMode(s, 'standing', t0 + 10 * min)).toEqual({ state: s, addMin: 0 })
  })

  it('rounds to whole minutes', () => {
    const s = switchMode(deskOff, 'standing', t0).state
    expect(standingMinutes(s, t0 + 29_000)).toBe(0)
    expect(standingMinutes(s, t0 + 90_000)).toBe(2)
  })

  it('reminds once per mode after its interval', () => {
    const s = switchMode(deskOff, 'standing', t0).state
    expect(reminderDue(s, t0 + 29 * min, 30, 45)).toBe(false)
    expect(reminderDue(s, t0 + 30 * min, 30, 45)).toBe(true)
    expect(reminderDue({ ...s, reminded: true }, t0 + 60 * min, 30, 45)).toBe(false)
    const sit = switchMode(s, 'sitting', t0).state
    expect(reminderDue(sit, t0 + 44 * min, 30, 45)).toBe(false)
    expect(reminderDue(sit, t0 + 45 * min, 30, 45)).toBe(true)
    expect(reminderDue(deskOff, t0 + 999 * min, 30, 45)).toBe(false)
  })

  it('parses saved state defensively', () => {
    expect(parseDesk(null)).toEqual(deskOff)
    expect(parseDesk({ mode: 'standing' })).toEqual(deskOff)
    expect(parseDesk({ mode: 'sitting', since: t0 })).toEqual({ mode: 'sitting', since: t0, reminded: false })
  })
})
