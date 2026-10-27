import { describe, expect, it } from 'vitest'
import { addDays, daysInMonth, diffDays, startOfWeek, weekday } from './dates'
import { isRestDay, planFor, programPosition, sessionOptionsFor, setsFor } from './schedule'
import { levelOf, nextLevel, resolveSlot, targetFor } from './progression'
import { bestStreak, currentStreak } from './streak'
import { isDayComplete, targetForDay } from './challenge'
import { templates, type StrengthTemplate } from '../data/templates'
import { starterChallenge } from '../data/challenges'
import { currentValue, goalProgress, isReached } from './goals'
import { testStatus } from './retest'
import { badges, isEarned } from './badges'
import { weekReview } from './weekReview'
import { exerciseHistory, recordFor, sessionRecords } from './records'
import { weekProgress } from './weekProgress'
import { playOrder, trackName } from './music'
import type { LoggedSet, Session } from '../db/db'

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

  it('steps over an empty rest day without counting it', () => {
    const SAT = addDays(MON, -2)
    const days = new Set([addDays(MON, -3), SAT, MON]) // Fri, Sat, (Sun rest), Mon
    expect(currentStreak(days, MON, isRestDay)).toBe(3)
    expect(currentStreak(days, MON)).toBe(1)
    expect(currentStreak(new Set([SAT]), MON, isRestDay)).toBe(1) // Monday not over yet
    expect(currentStreak(new Set([SAT]), addDays(MON, 1), isRestDay)).toBe(0)
    expect(bestStreak(days, isRestDay)).toBe(3)
    // An active rest day still counts.
    expect(bestStreak(new Set([SAT, addDays(MON, -1), MON]), isRestDay)).toBe(3)
    // Only planned rest days bridge: Tuesday is not one.
    expect(bestStreak(new Set([MON, addDays(MON, 2)]), isRestDay)).toBe(1)
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

  it('ramps from the start day when the challenge begins mid-month', () => {
    expect(targetForDay(plank, 21, 31, 21)).toBe(30)
    expect(targetForDay(plank, 31, 31, 21)).toBe(60)
  })

  it('a day is complete when every task is done', () => {
    expect(isDayComplete(starterChallenge.tasks, ['pushups', 'plank'])).toBe(false)
    expect(isDayComplete(starterChallenge.tasks, ['pushups', 'plank', 'situps'])).toBe(true)
  })
})

describe('goals', () => {
  const daily = [
    { date: '2026-10-01', weightKg: 86 },
    { date: '2026-10-20', weightKg: 84.4 },
    { date: '2026-10-22', weightKg: 84 },
  ]
  it('uses the 7-day weight average and the latest test', () => {
    expect(currentValue('weight', daily, [])).toBe(84.2)
    expect(currentValue('pushups', [], [{ date: '2026-10-01', pushups: 8 }, { date: '2026-10-29', pushups: 12 }, { date: '2026-11-01', waistCm: 90 }])).toBe(12)
    expect(currentValue('plankSec', [], [])).toBeUndefined()
  })
  it('measures progress in the right direction', () => {
    const lose = { metric: 'weight' as const, start: 86, target: 80, createdAt: '2026-10-01' }
    expect(goalProgress(lose, 83)).toBeCloseTo(0.5)
    expect(goalProgress(lose, 87)).toBe(0)
    expect(isReached(lose, 79.9)).toBe(true)
    const gain = { metric: 'pushups' as const, start: 8, target: 20, createdAt: '2026-10-01' }
    expect(goalProgress(gain, 14)).toBeCloseTo(0.5)
    expect(isReached(gain, 19)).toBe(false)
  })
})

describe('re-tests', () => {
  it('asks for a baseline, then every 4 weeks', () => {
    expect(testStatus('2026-10-19', [], '2026-10-22')).toMatchObject({ due: true, number: 1 })
    expect(testStatus('2026-10-19', ['2026-10-20'], '2026-10-30')).toMatchObject({ due: false, next: '2026-11-16' })
    expect(testStatus('2026-10-19', ['2026-10-20'], '2026-11-16')).toMatchObject({ due: true, number: 2, since: '2026-11-16' })
  })
})

describe('badges', () => {
  it('earns a badge when its stat reaches the need', () => {
    const stats = { workouts: 10, deskResets: 0, bestStreak: 2, levelUps: 0, fullChallengeMonths: 0, weightLost: 2.1, tests: 1, goalsReached: 0 }
    const earned = badges.filter((b) => isEarned(b, stats)).map((b) => b.id)
    expect(earned).toEqual(['first-bell', 'workouts-10', 'weight-2', 'baseline'])
  })
})

describe('week review', () => {
  const empty = { sessions: [], daily: [], tests: [], goals: [], levels: {}, challenges: [], challengeDays: [] }
  const session = (date: string, templateId: 'strengthA' | 'strengthB' | 'strengthC' | 'walk') =>
    ({ date, templateId, status: 'done' as const, startedAt: 0, sets: [] })

  it('counts the week and flags a strength day missed two weeks running', () => {
    const data = {
      ...empty,
      sessions: [
        session('2026-10-19', 'strengthA'), session('2026-10-21', 'strengthB'), // last week: Friday missed
        session('2026-10-26', 'strengthA'), session('2026-10-28', 'strengthB'), session('2026-10-29', 'walk'),
      ],
      daily: [
        { date: '2026-10-25', weightKg: 85 },
        { date: '2026-10-26', deskReset: true, food: { water: true, proteinVeg: true } },
        { date: '2026-11-01', weightKg: 84.4 },
      ],
    }
    const r = weekReview(data, '2026-10-26', 7000)
    expect(r).toMatchObject({ strength: 2, otherWorkouts: 1, lastWeekWorkouts: 2, deskResets: 1, weightChange: -0.6 })
    expect(r.focus).toEqual({ key: 'missedDay', day: 4 })
  })

  it('a make-up the next day counts, and a full week says keep going', () => {
    const daily = Array.from({ length: 7 }, (_, i) => ({
      date: addDays('2026-10-26', i),
      deskReset: true,
      food: { noSugaryDrinks: true, water: true, noSnacks: true, proteinVeg: true },
    }))
    const data = {
      ...empty,
      sessions: [session('2026-10-26', 'strengthA'), session('2026-10-29', 'strengthB'), session('2026-10-30', 'strengthC')],
      daily,
    }
    expect(weekReview(data, '2026-10-26', 7000).focus).toEqual({ key: 'keepGoing' })
  })
})

describe('personal records', () => {
  const set = (exerciseId: string, reps: number): LoggedSet => ({ exerciseId, setNo: 1, reps })
  const history = [set('pushup', 10), set('pushup', 12), set('squat', 15)]

  it('needs an earlier set to beat', () => {
    expect(recordFor(set('pushup', 13), history)).toEqual({ exerciseId: 'pushup', value: 13, unit: 'reps', previous: 12 })
    expect(recordFor(set('pushup', 12), history)).toBeUndefined()
    expect(recordFor(set('lunge', 20), history)).toBeUndefined() // first try
  })

  it('counts a record once per session unless it goes higher', () => {
    const today = [set('pushup', 13)]
    expect(recordFor(set('pushup', 13), history, today)).toBeUndefined()
    expect(recordFor(set('pushup', 14), history, today)?.previous).toBe(12)
    expect(sessionRecords([set('pushup', 13), set('pushup', 14), set('squat', 10)], history)).toEqual([
      { exerciseId: 'pushup', value: 14, unit: 'reps', previous: 12 },
    ])
  })

  it('reads seconds for timed sets', () => {
    const hold = (seconds: number): LoggedSet => ({ exerciseId: 'plank', setNo: 1, seconds })
    expect(recordFor(hold(45), [hold(40)])?.unit).toBe('seconds')
  })
})

describe('week review feel', () => {
  it('puts two too-hard workouts first', () => {
    const s = (date: string, rating?: 5): Session => ({ date, templateId: 'strengthA', status: 'done', startedAt: 0, sets: [], rating })
    const data = { sessions: [s('2026-10-26', 5), s('2026-10-28', 5), s('2026-10-30')], daily: [], tests: [], goals: [], levels: {}, challenges: [], challengeDays: [] }
    expect(weekReview(data, '2026-10-26', 7000).focus).toEqual({ key: 'tooHard', n: 2 })
    data.sessions[1].rating = undefined
    expect(weekReview(data, '2026-10-26', 7000).focus.key).not.toBe('tooHard')
  })
})

describe('exercise history', () => {
  const session = (date: string, startedAt: number, sets: LoggedSet[], status: Session['status'] = 'done'): Session => ({
    date, templateId: 'strengthA', status, startedAt, sets,
  })
  it('lists sessions newest first with the best set', () => {
    const sessions = [
      session('2026-10-28', 2, [{ exerciseId: 'pushup', setNo: 2, reps: 9 }, { exerciseId: 'pushup', setNo: 1, reps: 11 }]),
      session('2026-10-26', 1, [{ exerciseId: 'pushup', setNo: 1, reps: 10 }, { exerciseId: 'squat', setNo: 1, reps: 20 }]),
      session('2026-10-30', 3, [{ exerciseId: 'pushup', setNo: 1, reps: 30 }], 'active'),
    ]
    expect(exerciseHistory(sessions, 'pushup')).toEqual({
      unit: 'reps',
      best: { value: 11, date: '2026-10-28' },
      days: [
        { date: '2026-10-28', values: [11, 9] },
        { date: '2026-10-26', values: [10] },
      ],
    })
    expect(exerciseHistory(sessions, 'lunge')).toBeUndefined()
  })
})

describe('week progress', () => {
  const s = (date: string, templateId: Session['templateId']): Session => ({ date, templateId, status: 'done', startedAt: 0, sets: [] })
  it('marks each planned day, with make-ups and without desk resets', () => {
    // Mon strength made up on Tue, Tue's own slot counts too; Wed only a desk reset
    const sessions = [s(addDays(MON, 1), 'strengthA'), s(addDays(MON, 2), 'deskReset')]
    const w = weekProgress(sessions, addDays(MON, 3))
    expect(w.days.map((d) => d.state)).toEqual(['done', 'done', 'missed', 'today', 'upcoming', 'upcoming', 'rest'])
    expect(w).toMatchObject({ done: 2, planned: 6 })
  })
})

describe('music', () => {
  it('names songs from their file names', () => {
    expect(trackName('03 - Eye of the Tiger.mp3')).toBe('Eye of the Tiger')
    expect(trackName('Dino_Merlin_Burek.m4a')).toBe('Dino Merlin Burek')
    expect(trackName('2pac.mp3')).toBe('2pac')
  })

  it('plays in order from the tapped song, wrapping around', () => {
    expect(playOrder(4, 2)).toEqual([2, 3, 0, 1])
    expect(playOrder(0)).toEqual([])
  })

  it('shuffles every song once, starting with the tapped one', () => {
    const order = playOrder(5, 3, true, () => 0.5)
    expect(order[0]).toBe(3)
    expect([...order].sort()).toEqual([0, 1, 2, 3, 4])
  })
})
