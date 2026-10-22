import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Page } from '../../components/Page'
import { Sheet } from '../../components/Sheet'
import { Button, Card, Chips, ToggleChip } from '../../components/ui'
import { BarChart, Sparkline, TrendChart, type Point } from '../../components/charts'
import { useT } from '../../i18n/I18nProvider'
import type { MessageKey } from '../../i18n/en'
import { templates } from '../../data/templates'
import { db, type Goal, type GoalMetric, type TestResult } from '../../db/db'
import { useSettings } from '../../db/settings'
import { deleteGoal, markReachedGoals, useAllData } from '../../db/queries'
import { addDays, formatDay, formatShort, startOfWeek, today as todayISO } from '../../logic/dates'
import { currentValue, goalProgress, lowerIsBetter, weightAverage } from '../../logic/goals'
import { testStatus } from '../../logic/retest'
import { computeStats } from '../../logic/stats'
import { badges, isEarned, type Badge } from '../../logic/badges'
import { formatClock } from '../../hooks/useCountdown'
import { GoalSheet } from './GoalSheet'
import { metricInfo, testMetrics } from './metrics'
import styles from './Progress.module.css'

const toeOptions = ['knee', 'shin', 'ankle', 'toes', 'floor'] as const
type Toe = (typeof toeOptions)[number]

function TestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT()
  const [toe, setToe] = useState<Toe | undefined>()

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const result: TestResult = { date: todayISO(), toeTouch: toe }
    for (const key of testMetrics) {
      const raw = String(form.get(key) ?? '').replace(',', '.').trim()
      const n = Number(raw)
      if (raw && Number.isFinite(n)) result[key] = n
    }
    await db.tests.add(result)
    setToe(undefined)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('progress.addTest')}>
      <form className={styles.form} onSubmit={submit}>
        <div className="muted">{t('progress.testIntro')}</div>
        {testMetrics.map((key) => (
          <div key={key} className={styles.form}>
            <label className={styles.field}>
              <span>{t(metricInfo[key].label)}</span>
              <input name={key} type="text" inputMode="decimal" />
            </label>
            {metricInfo[key].how && <div className="muted">{t(metricInfo[key].how!)}</div>}
          </div>
        ))}
        <div className={styles.field}>
          <span>{t('test.toeTouch')}</span>
        </div>
        <div className="muted">{t('testHow.toeTouch')}</div>
        <Chips>
          {toeOptions.map((o) => (
            <ToggleChip key={o} selected={toe === o} onClick={() => setToe(o)}>
              {t(`toe.${o}` as MessageKey)}
            </ToggleChip>
          ))}
        </Chips>
        <Button type="submit" block>
          {t('common.save')}
        </Button>
      </form>
    </Sheet>
  )
}

function GoalRow({ goal, current }: { goal: Goal; current: number | undefined }) {
  const { t, lang } = useT()
  const info = metricInfo[goal.metric]
  const unit = t(info.unit)
  const progress = goalProgress(goal, current)
  return (
    <div className={styles.goal}>
      <div className={styles.goalTop}>
        <span className={styles.goalName}>{t(info.label)}</span>
        <span className={styles.goalValues}>
          {current ?? '–'} → <b>{goal.target}</b> {unit}
        </span>
      </div>
      <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className={styles.barFill} style={{ width: `${progress * 100}%` }} />
      </div>
      <div className={styles.goalMeta}>
        {goal.reachedAt ? (
          <span className={styles.reached}>★ {t('goal.reached', { date: formatShort(goal.reachedAt, lang) })}</span>
        ) : (
          <span>
            {Math.round(progress * 100)}%{goal.deadline && ` · ${t('goal.by', { date: formatShort(goal.deadline, lang) })}`}
          </span>
        )}
        <button
          type="button"
          className={styles.remove}
          onClick={() => window.confirm(t('goal.removeConfirm')) && void deleteGoal(goal.id!)}
        >
          {t('goal.remove')}
        </button>
      </div>
    </div>
  )
}

function BadgeView({ badge, earned, progress }: { badge: Badge; earned: boolean; progress: number }) {
  const { l, t } = useT()
  return (
    <div className={`${styles.badge} ${earned ? styles.earned : styles.locked}`}>
      <div className={styles.medal} aria-hidden="true">
        {badge.glyph}
      </div>
      <div className={styles.badgeName}>{l(badge.name)}</div>
      <div className={styles.badgeHow}>{l(badge.how)}</div>
      <div className={earned ? styles.reached : 'muted'}>
        {earned ? t('badge.earned') : `${Math.min(Math.floor(progress), badge.need)} / ${badge.need}`}
      </div>
    </div>
  )
}

export function ProgressPage() {
  const { t, l, lang } = useT()
  const date = todayISO()
  const data = useAllData()
  const settings = useSettings()
  const [params, setParams] = useSearchParams()
  const [adding, setAdding] = useState(params.get('test') === '1')
  const [addingGoal, setAddingGoal] = useState(false)

  useEffect(() => {
    if (data) void markReachedGoals(data, date)
  }, [data, date])

  if (!data || !settings) return null

  const closeTest = () => {
    setAdding(false)
    if (params.has('test')) setParams({}, { replace: true })
  }

  // ── weight
  const weighIns = data.daily.filter((d) => d.weightKg)
  const since = addDays(date, -89)
  const recent = weighIns.filter((d) => d.date >= since)
  const points: Point[] = recent.map((d) => ({ date: d.date, value: d.weightKg! }))
  const trend: Point[] = recent.map((d) => ({ date: d.date, value: weightAverage(data.daily, d.date)! }))
  const latest = weighIns.at(-1)
  const avg = latest ? weightAverage(data.daily, latest.date) : undefined
  const change = avg !== undefined && weighIns.length > 1 ? Math.round((avg - weighIns[0].weightKg!) * 10) / 10 : undefined
  const weightGoal = data.goals.find((g) => g.metric === 'weight' && !g.reachedAt) ?? data.goals.find((g) => g.metric === 'weight')

  // ── workouts
  const done = data.sessions.filter((s) => s.status === 'done').reverse()
  const weekStart = startOfWeek(date)
  const thisWeek = done.filter((s) => s.date >= weekStart).length
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(weekStart, -7 * (11 - i)))
  const bars = weeks.map((w) => ({
    key: w,
    label: formatShort(w, lang),
    value: done.filter((s) => s.date >= w && s.date < addDays(w, 7)).length,
  }))

  // ── tests
  const status = testStatus(settings.startDate, data.tests.map((r) => r.date), date)

  // ── milestones
  const stats = computeStats(data, date)
  const earnedCount = badges.filter((b) => isEarned(b, stats)).length
  const current = (m: GoalMetric) => currentValue(m, data.daily, data.tests)

  return (
    <Page title={t('progress.title')}>
      <Card>
        <div className={styles.cardHead}>
          <div className="label">{t('goal.title')}</div>
        </div>
        {data.goals.length === 0 && <div className="muted">{t('goal.none')}</div>}
        {data.goals.map((g) => (
          <GoalRow key={g.id} goal={g} current={current(g.metric)} />
        ))}
        <Button variant="secondary" block onClick={() => setAddingGoal(true)}>
          {t('goal.add')}
        </Button>
      </Card>

      <Card>
        <div className="label">{t('progress.weight')}</div>
        {latest ? (
          <>
            <div className={styles.stats}>
              <div>
                <div className={styles.value}>{latest.weightKg}</div>
                <div className="muted">{t('progress.latest')}</div>
              </div>
              <div>
                <div className={styles.value}>{avg ?? '–'}</div>
                <div className="muted">{t('progress.avg7')}</div>
              </div>
              <div>
                <div className={styles.value}>{change === undefined ? '–' : `${change > 0 ? '+' : ''}${change}`}</div>
                <div className="muted">{t('progress.change')}</div>
              </div>
            </div>
            {trend.length > 1 && (
              <>
                <TrendChart
                  points={points}
                  trend={trend}
                  goal={weightGoal?.target}
                  goalLabel={weightGoal && t('goal.line', { v: weightGoal.target })}
                  unit={t('unit.kg')}
                  lang={lang}
                  label={t('progress.weightChart')}
                />
                <div className="muted">{t('progress.weightLegend')}</div>
              </>
            )}
            <details className={styles.details}>
              <summary>{t('progress.allEntries')}</summary>
              <ul className={styles.list}>
                {weighIns.slice().reverse().map((w) => (
                  <li key={w.date}>
                    <span className="muted">{formatDay(w.date, lang)}</span>
                    <span>
                      {w.weightKg} {t('unit.kg')}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <div className="muted">{t('progress.noWeight')}</div>
        )}
      </Card>

      <Card>
        <div className="label">{t('progress.sessions')}</div>
        <div className={styles.stats}>
          <div>
            <div className={styles.value}>{thisWeek}</div>
            <div className="muted">{t('progress.thisWeek')}</div>
          </div>
          <div>
            <div className={styles.value}>{done.length}</div>
            <div className="muted">{t('progress.total')}</div>
          </div>
          <div>
            <div className={styles.value}>{stats.bestStreak}</div>
            <div className="muted">{t('progress.bestStreak')}</div>
          </div>
        </div>
        {done.length === 0 ? (
          <div className="muted">{t('progress.noSessions')}</div>
        ) : (
          <>
            <BarChart
              bars={bars}
              label={t('progress.weeksChart')}
              describe={(v, w) => t('progress.weekTip', { n: v, date: w })}
            />
            <ul className={styles.list}>
              {done.slice(0, 10).map((s) => (
                <li key={s.id}>
                  <span className="muted">{formatDay(s.date, lang)}</span>
                  <span className={styles.grow}>{l(templates[s.templateId].name)}</span>
                  <span className="muted">{s.endedAt ? formatClock(Math.round((s.endedAt - s.startedAt) / 1000)) : ''}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <div className="label">{t('progress.tests')}</div>
        <div className="muted">
          {status.due
            ? t(status.number === 1 ? 'retest.baselineDue' : 'retest.due')
            : t('retest.next', { date: formatShort(status.next, lang) })}
        </div>
        {data.tests.length === 0 ? (
          <div className="muted">{t('progress.noTests')}</div>
        ) : (
          <>
            {testMetrics.map((key) => {
              const rows = data.tests.filter((r) => r[key] !== undefined)
              if (!rows.length) return null
              const first = rows[0][key]!
              const last = rows[rows.length - 1][key]!
              const better = lowerIsBetter(key) ? last < first : last > first
              const delta = Math.round((last - first) * 10) / 10
              return (
                <div key={key} className={styles.trendRow}>
                  <span className={styles.trendName}>{t(metricInfo[key].label)}</span>
                  <Sparkline values={rows.map((r) => r[key]!)} label={t(metricInfo[key].label)} />
                  <span className={styles.trendValue}>
                    <b>{last}</b>
                    {rows.length > 1 && delta !== 0 && (
                      <span className={better ? styles.better : 'muted'}>
                        {' '}
                        {delta > 0 ? '▲' : '▼'}
                        {Math.abs(delta)}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
            <details className={styles.details}>
              <summary>{t('progress.allResults')}</summary>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th></th>
                      {data.tests.map((r) => (
                        <th key={r.id}>{formatShort(r.date, lang)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testMetrics.map((key) => (
                      <tr key={key}>
                        <th>{t(metricInfo[key].label)}</th>
                        {data.tests.map((r) => (
                          <td key={r.id}>{r[key] ?? '–'}</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th>{t('test.toeTouch')}</th>
                      {data.tests.map((r) => (
                        <td key={r.id}>{r.toeTouch ? t(`toe.${r.toeTouch}` as MessageKey) : '–'}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
        <Button variant={status.due ? 'primary' : 'secondary'} block onClick={() => setAdding(true)}>
          {t('progress.addTest')}
        </Button>
      </Card>

      <Card>
        <div className={styles.cardHead}>
          <div className="label">{t('badge.title')}</div>
          <div className="muted">
            {earnedCount} / {badges.length}
          </div>
        </div>
        <div className={styles.badges}>
          {badges.map((b) => (
            <BadgeView key={b.id} badge={b} earned={isEarned(b, stats)} progress={stats[b.stat]} />
          ))}
        </div>
      </Card>

      <TestSheet open={adding} onClose={closeTest} />
      <GoalSheet open={addingGoal} onClose={() => setAddingGoal(false)} current={current} />
    </Page>
  )
}
