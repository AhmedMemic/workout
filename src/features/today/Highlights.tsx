import { Link } from 'react-router-dom'
import { Button, Card, buttonClass } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { saveSetting, type Settings } from '../../db/settings'
import { useAllData, useChallenge } from '../../db/queries'
import { currentValue, goalProgress } from '../../logic/goals'
import { testStatus } from '../../logic/retest'
import { computeStats } from '../../logic/stats'
import { badges, isEarned } from '../../logic/badges'
import { dayOfMonth, daysInMonth, monthKey, type ISODate } from '../../logic/dates'
import { planFor } from '../../logic/schedule'
import { metricInfo } from '../progress/metrics'
import { nextMonth } from '../challenge/months'
import styles from './Today.module.css'

/** Cards that only show up when there's something to act on: new milestone, test day, goal, next challenge. */
export function Highlights({ date, settings }: { date: ISODate; settings: Settings }) {
  const { t, l } = useT()
  const data = useAllData()
  const upcoming = nextMonth(monthKey(date))
  const nextChallenge = useChallenge(upcoming)
  if (!data) return null

  const stats = computeStats(data, date)
  const fresh = badges.filter((b) => isEarned(b, stats) && !settings.seenBadges.includes(b.id))
  const tests = testStatus(settings.startDate, data.tests.map((r) => r.date), date)
  const showTests = tests.due && settings.retestSkipped !== tests.since
  const goal = data.goals.find((g) => !g.reachedAt)
  const monthEnding = daysInMonth(monthKey(date)) - dayOfMonth(date) < 5

  return (
    <>
      {fresh.length > 0 && (
        <Card className={styles.highlight}>
          <div className="label">{t(fresh.length > 1 ? 'today.newBadges' : 'today.newBadge')}</div>
          <div className={styles.badgeRow}>
            {fresh.slice(0, 4).map((b) => (
              <div key={b.id} className={styles.miniBadge}>
                <span className={styles.miniMedal}>{b.glyph}</span>
                <span>{l(b.name)}</span>
              </div>
            ))}
          </div>
          <Button
            block
            onClick={() => void saveSetting('seenBadges', badges.filter((b) => isEarned(b, stats)).map((b) => b.id))}
          >
            {t('today.badgeOk')}
          </Button>
        </Card>
      )}

      {showTests && (
        <Card>
          <div className="label">{t(tests.number === 1 ? 'today.baselineTitle' : 'today.retestTitle')}</div>
          <div className="muted">
            {t(planFor(date).kind === 'strength' ? 'today.retestInstead' : 'today.retestText')}
          </div>
          <Link to="/progress?test=1" className={buttonClass('primary', true)}>
            {t('today.retestGo')}
          </Link>
          <Button variant="secondary" block onClick={() => void saveSetting('retestSkipped', tests.since)}>
            {t('today.retestSkip')}
          </Button>
        </Card>
      )}

      {goal && (
        <Link to="/progress" className={styles.strip}>
          <div className={styles.stripHead}>
            <span className={styles.stripTitle}>
              {t('today.goal')} · {t(metricInfo[goal.metric].label)}
            </span>
            <span className="muted">
              {currentValue(goal.metric, data.daily, data.tests) ?? '–'} → {goal.target} {t(metricInfo[goal.metric].unit)}
            </span>
          </div>
          <div className={styles.goalBar}>
            <div
              className={styles.goalFill}
              style={{ width: `${goalProgress(goal, currentValue(goal.metric, data.daily, data.tests)) * 100}%` }}
            />
          </div>
        </Link>
      )}

      {monthEnding && nextChallenge === undefined && (
        <Link to={`/challenge?month=${upcoming}`} className={styles.strip}>
          <div className={styles.stripHead}>
            <span className={styles.stripTitle}>{t('today.pickNext')}</span>
            <span className="muted">→</span>
          </div>
          <div className="muted">{t('today.pickNextText')}</div>
        </Link>
      )}
    </>
  )
}
