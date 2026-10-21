import { useState } from 'react'
import { Page } from '../../components/Page'
import { Sheet } from '../../components/Sheet'
import { Icon } from '../../components/Icon'
import { Button, Card } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { challengeIdeas } from '../../data/challenges'
import { replaceChallenge, useChallenge, useChallengeDays } from '../../db/queries'
import { daysInMonth, formatMonth, monthKey, today as todayISO, weekday, weekdayName, type ISODate } from '../../logic/dates'
import { isDayComplete, targetForDay } from '../../logic/challenge'
import { bestStreak } from '../../logic/streak'
import { ChallengeSheet } from '../today/sheets'
import styles from './Challenge.module.css'

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function ChallengePage() {
  const { t, l, lang } = useT()
  const todayDate = todayISO()
  const currentMonth = monthKey(todayDate)
  const [month, setMonth] = useState(currentMonth)
  const [openDate, setOpenDate] = useState<ISODate | null>(null)
  const [picking, setPicking] = useState(false)

  const challenge = useChallenge(month)
  const days = useChallengeDays(month)
  const n = daysInMonth(month)
  const monthName = formatMonth(`${month}-01`, lang)
  const isCurrent = month === currentMonth

  const dates = Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
  const tasks = challenge?.tasks ?? []
  const startDay = challenge?.startDay ?? 1
  const complete = new Set(dates.filter((d) => isDayComplete(tasks, days?.get(d) ?? [])))
  const offset = weekday(dates[0])
  const todayDay = Number(todayDate.slice(8, 10))

  return (
    <Page title={t('today.challenge')}>
      <div className={styles.monthNav}>
        <button type="button" className={styles.navButton} onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t('challenge.prev')}>
          <Icon name="chevronLeft" />
        </button>
        <div className={styles.monthName}>
          {monthName} {month.slice(0, 4)}
        </div>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={isCurrent}
          aria-label={t('challenge.next')}
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      {!challenge ? (
        <p className="muted">{t('challenge.none')}</p>
      ) : (
        <>
          <Card>
            <div className="label">{l(challengeIdeas.find((c) => c.id === challenge.ideaId)?.name ?? { en: '', bs: '' })}</div>
            <div className={styles.score}>{t('challenge.daysDone', { a: complete.size, b: n - startDay + 1 })}</div>
            <div className="muted">{t('challenge.best', { n: bestStreak(complete) })}</div>
            {isCurrent && (
              <>
                <div className="label">{t('challenge.tasks')}</div>
                <ul className={styles.tasks}>
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <span>{l(task.name)}</span>
                      <span className="muted">
                        {task.unit === 'check' ? '✓' : `${targetForDay(task, todayDay, n, startDay)} ${t(task.unit === 'reps' ? 'unit.reps' : task.unit === 'seconds' ? 'unit.seconds' : 'unit.minutes')}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <div className={styles.calendar}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={`h${i}`} className={styles.weekday}>
                {weekdayName(i, lang)}
              </div>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`b${i}`} />
            ))}
            {dates.map((d, i) => {
              const done = days?.get(d) ?? []
              const state = complete.has(d) ? styles.done : done.length ? styles.partial : ''
              const future = d > todayDate || i + 1 < startDay
              return (
                <button
                  key={d}
                  type="button"
                  disabled={future}
                  className={[styles.day, state, d === todayDate && styles.today].filter(Boolean).join(' ')}
                  onClick={() => setOpenDate(d)}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          {isCurrent && (
            <Button variant="secondary" block onClick={() => setPicking(true)}>
              {t('challenge.change')}
            </Button>
          )}

          {openDate && (
            <ChallengeSheet
              open
              onClose={() => setOpenDate(null)}
              date={openDate}
              challenge={challenge}
              done={days?.get(openDate) ?? []}
              showCalendarLink={false}
            />
          )}
        </>
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title={t('challenge.pick', { month: monthName })}>
        <div className="muted">{t('challenge.changeWarn')}</div>
        {challengeIdeas.map((idea) => (
          <Button
            key={idea.id}
            variant={idea.id === challenge?.ideaId ? 'primary' : 'secondary'}
            block
            onClick={async () => {
              await replaceChallenge(month, idea.id)
              setPicking(false)
            }}
          >
            {l(idea.name)}
          </Button>
        ))}
      </Sheet>
    </Page>
  )
}
