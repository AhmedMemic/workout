import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { CornerDB } from './db'
import { exportBackup, importBackup, parseBackup } from './backup'
import { loadAllData } from './queries'
import { computeStats } from '../logic/stats'

describe('backup', () => {
  it('round-trips every table', async () => {
    const a = new CornerDB('a')
    await a.settings.put({ key: 'stepGoal', value: 8000 })
    await a.daily.put({ date: '2026-10-26', weightKg: 84.6, food: { water: true } })
    await a.sessions.add({ date: '2026-10-26', templateId: 'strengthA', status: 'done', startedAt: 1, sets: [] })
    await a.challengeDays.put({ month: '2026-10', date: '2026-10-26', done: ['pushups'] })

    const json = JSON.stringify(await exportBackup(a))
    const b = new CornerDB('b')
    await b.daily.put({ date: '2020-01-01', steps: 1 }) // should be replaced
    await importBackup(parseBackup(json), b)

    expect(await b.daily.toArray()).toEqual([{ date: '2026-10-26', weightKg: 84.6, food: { water: true } }])
    expect((await b.settings.get('stepGoal'))?.value).toBe(8000)
    expect(await b.sessions.count()).toBe(1)
    expect((await b.challengeDays.get(['2026-10', '2026-10-26']))?.done).toEqual(['pushups'])
  })

  it('rejects other files', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow()
  })
})

describe('loadAllData', () => {
  it('reads every table and feeds the milestone stats', async () => {
    const d = new CornerDB('all')
    await d.sessions.add({ date: '2026-10-21', templateId: 'strengthB', status: 'done', startedAt: 2, sets: [] })
    await d.sessions.add({ date: '2026-10-19', templateId: 'strengthA', status: 'done', startedAt: 1, sets: [] })
    await d.daily.put({ date: '2026-10-20', weightKg: 85, deskReset: true })
    await d.goals.add({ metric: 'weight', target: 80, start: 85, createdAt: '2026-10-20' })
    const data = await loadAllData(d)
    expect(data.sessions.map((s) => s.templateId)).toEqual(['strengthA', 'strengthB'])
    expect(data.goals).toHaveLength(1)
    expect(computeStats(data, '2026-10-22')).toMatchObject({ workouts: 2, deskResets: 1, bestStreak: 3 })
  })
})
