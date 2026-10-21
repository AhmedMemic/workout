import { describe, expect, it } from 'vitest'
import { addDays, daysInMonth, diffDays, startOfWeek, weekday } from './dates'
import { planFor, programPosition, sessionOptionsFor, setsFor } from './schedule'
import { levelOf, nextLevel, resolveSlot, targetFor } from './progression'
import { bestStreak, currentStreak } from './streak'
import { isDayComplete, targetForDay } from './challenge'
import { templates, type StrengthTemplate } from '../data/templates'
import { starterChallenge } from '../data/challenges'

// 2026-10-26 is a Monday
const MON = '2026-10-26'

describe('dates', () => {
  it('handles weekdays, weeks and months', () => {
    expect(weekday(MON)).toBe(0)
    expect(weekday('2026-11-01')).toBe(6)
    expect(startOfWeek('2026-10-29')).toBe(MON)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(diffDays('2026-10-01', '2026-11-01')).toBe(31)
    expect(daysInMonth('2026-02')).toBe(28)
  })
})

describe('schedule', () => {
  it('follows the weekly plan', () => {
    expect(planFor(MON).options[0]).toBe('strengthA')
    expect(planFor(addDays(MON, 2)).options[0]).toBe('strengthB')
    expect(planFor(addDays(MON, 4)).options[0]).toBe('strengthC')
    expect(planFor(addDays(MON, 6)).kind).toBe('rest')
  })

  it('counts blocks, weeks and deloads', () => {
    expect(programPosition(MON, MON)).toEqual({ block: 1, week: 1, deload: false })
    expect(programPosition(MON, addDays(MON, 21))).toEqual({ block: 1, week: 4, deload: true })
    expect(programPosition(MON, addDays(MON, 28))).toEqual({ block: 2, week: 1, deload: false })
  })

  it('sets: block 1 = 2, later 3, deload one less', () => {
    expect(setsFor({ block: 1, week: 1, deload: false })).toBe(2)
    expect(setsFor({ block: 1, week: 4, deload: true })).toBe(1)
    expect(setsFor({ block: 2, week: 2, deload: false })).toBe(3)
    expect(setsFor({ block: 2, week: 4, deload: true })).toBe(2)
  })

  it('offers a missed strength session the next day', () => {
    const tue = addDays(MON, 1)
    expect(sessionOptionsFor(tue, new Map()).makeUp).toBe('strengthA')
    expect(sessionOptionsFor(tue, new Map([[MON, ['strengthA']]])).makeUp).toBeUndefined()
  })
})

describe('progression', () => {
  const a = templates.strengthA as StrengthTemplate
  const pushSlot = a.pairs[1][0] // A2a, push chain, 6–15 reps

  it('resolves chain slots from levels', () => {
    expect(resolveSlot(pushSlot, {})).toBe('pushup') // default level 1
    expect(resolveSlot(pushSlot, { push: 0 })).toBe('incline-pushup')
    expect(levelOf('push', { push: 99 })).toBe(4)
  })

  it('picks reps or time from the exercise', () => {
    const coreSlot = (templates.strengthC as StrengthTemplate).pairs[2][1]
    expect(targetFor(coreSlot, 'plank').measure).toBe('time')
    expect(targetFor(coreSlot, 'ball-rollout')).toMatchObject({ measure: 'reps', min: 6, max: 10 })
  })

  it('moves up only when every planned set hits the top', () => {
    expect(nextLevel(pushSlot, {}, [15, 15], 2)).toBe(2)
    expect(nextLevel(pushSlot, {}, [15, 12], 2)).toBeUndefined()
    expect(nextLevel(pushSlot, {}, [15], 2)).toBeUndefined()
    expect(nextLevel(pushSlot, { push: 4 }, [15, 15], 2)).toBeUndefined() // top of ladder
  })
})

describe('streak', () => {
  it('counts back from today, or from yesterday if today is empty', () => {
    const days = new Set([addDays(MON, -2), addDays(MON, -1), MON])
    expect(currentStreak(days, MON)).toBe(3)
    expect(currentStreak(days, addDays(MON, 1))).toBe(3)
    expect(currentStreak(days, addDays(MON, 2))).toBe(0)
  })

  it('finds the best run', () => {
    expect(bestStreak(new Set([MON, addDays(MON, 1), addDays(MON, 5)]))).toBe(2)
  })
})

describe('challenge', () => {
  const [pushups, plank] = starterChallenge.tasks

  it('ramps targets over the month', () => {
    expect(targetForDay(pushups, 15, 30)).toBe(10)
    expect(targetForDay(plank, 1, 30)).toBe(30)
    expect(targetForDay(plank, 30, 30)).toBe(60)
    expect(targetForDay(plank, 15, 30) % 5).toBe(0)
  })

  it('a day is complete when every task is done', () => {
    expect(isDayComplete(starterChallenge.tasks, ['pushups', 'plank'])).toBe(false)
    expect(isDayComplete(starterChallenge.tasks, ['pushups', 'plank', 'situps'])).toBe(true)
  })
})
