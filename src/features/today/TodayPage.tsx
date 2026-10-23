import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/Page'
import { LangToggle } from '../../components/LangToggle'
import { CheckRow, type CheckState } from '../../components/CheckRow'
import { Chip, Chips, buttonClass } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n/I18nProvider'
import { habits } from '../../data/habits'
import { templates } from '../../data/templates'
import { useSettings } from '../../db/settings'
import {
  useActiveDates,
  useActiveSession,
  useChallenge,
  useChallengeDays,
  useDaily,
  useDoneByDate,
} from '../../db/queries'
import { dayOfMonth, daysInMonth, formatDay, formatMonth, formatNumber, monthKey, today as todayISO } from '../../logic/dates'
import { isRestDay, programPosition, sessionOptionsFor } from '../../logic/schedule'
import { currentStreak } from '../../logic/streak'
import { isDayComplete } from '../../logic/challenge'
import { SessionCard } from './SessionCard'
import { Highlights } from './Highlights'
import { WeekStrip } from './WeekStrip'
import { ChallengeSheet, DeskResetSheet, FoodSheet, NumberSheet } from './sheets'
import styles from './Today.module.css'

type SheetName = 'desk' | 'challenge' | 'steps' | 'weight' | 'food' | null

export function TodayPage() {
  const { t, lang } = useT()
  const date = todayISO()
  const month = monthKey(date)
  const [sheet, setSheet] = useState<SheetName>(null)

  const settings = useSettings()
  const daily = useDaily(date)
  const doneByDate = useDoneByDate(date)
  const active = useActiveDates()
  const activeSession = useActiveSession()
  const challenge = useChallenge(month)
  const challengeDays = useChallengeDays(month)

  if (!settings || !doneByDate) return null

  const pos = programPosition(settings.startDate, date)
  const { options, makeUp } = sessionOptionsFor(date, doneByDate)
  const streak = active ? currentStreak(active, date, isRestDay) : 0

  const todayDone = challengeDays?.get(date) ?? []
  const tasks = challenge?.tasks ?? []
  const challengeState: CheckState =
    tasks.length && isDayComplete(tasks, todayDone) ? 'done' : todayDone.length ? 'partial' : 'empty'

  const steps = daily?.steps
  const foodDone = habits.filter((h) => daily?.food?.[h.id]).length
  const days = daysInMonth(month)
  const day = dayOfMonth(date)

  return (
    <Page
      title={t('today.title')}
      eyebrow={formatDay(date, lang)}
      actions={<LangToggle />}
    >
      <Chips>
        <Chip>
          <Icon name="flame" size={16} className={styles.flame} />
          {t('today.streak', { n: streak })}
        </Chip>
        <Chip>
          {t('today.block', { b: pos.block, w: pos.week })}
          {pos.deload && ` · ${t('today.deload')}`}
        </Chip>
      </Chips>

      {activeSession && (
        <Link to={`/workout/${activeSession.templateId}`} className={buttonClass('secondary', true)}>
          {t('today.resume')} · {templates[activeSession.templateId].name[lang]}
        </Link>
      )}

      <Highlights date={date} settings={settings} />

      <SessionCard options={options} makeUp={makeUp} done={doneByDate.get(date) ?? []} />

      <WeekStrip date={date} />

      <section className={styles.section}>
        <div className="label">{t('today.basics')}</div>
        <CheckRow
          state={daily?.deskReset ? 'done' : 'empty'}
          label={t('today.deskReset')}
          value={t('today.minutes', { n: 12 })}
          onClick={() => setSheet('desk')}
        />
        <CheckRow
          state={challengeState}
          label={t('today.challenge')}
          value={t('today.of', { a: todayDone.length, b: tasks.length })}
          onClick={() => setSheet('challenge')}
        />
        <CheckRow
          state={steps === undefined ? 'empty' : steps >= settings.stepGoal ? 'done' : 'partial'}
          label={t('today.steps')}
          value={`${steps !== undefined ? formatNumber(steps, lang) : '–'} / ${formatNumber(settings.stepGoal, lang)}`}
          onClick={() => setSheet('steps')}
        />
        <CheckRow
          state={daily?.weightKg ? 'done' : 'empty'}
          label={t('today.weighIn')}
          value={daily?.weightKg ? `${daily.weightKg} ${t('unit.kg')}` : undefined}
          onClick={() => setSheet('weight')}
        />
        <CheckRow
          state={foodDone === habits.length ? 'done' : foodDone ? 'partial' : 'empty'}
          label={t('today.food')}
          value={`${foodDone} / ${habits.length}`}
          onClick={() => setSheet('food')}
        />
      </section>

      {challenge && challengeDays && (
        <Link to="/challenge" className={styles.strip}>
          <div className={styles.stripHead}>
            <span className={styles.stripTitle}>{formatMonth(date, lang)} · {t('today.challenge')}</span>
            <span className="muted">{t('today.dayOf', { d: day, n: days })}</span>
          </div>
          <div className={styles.dots}>
            {Array.from({ length: days }, (_, i) => {
              const d = `${month}-${String(i + 1).padStart(2, '0')}`
              const complete = isDayComplete(tasks, challengeDays.get(d) ?? [])
              const cls = [styles.dot, complete && styles.dotDone, d === date && styles.dotToday].filter(Boolean).join(' ')
              return <span key={d} className={cls} />
            })}
          </div>
        </Link>
      )}

      <DeskResetSheet open={sheet === 'desk'} onClose={() => setSheet(null)} date={date} done={!!daily?.deskReset} />
      {challenge && (
        <ChallengeSheet
          open={sheet === 'challenge'}
          onClose={() => setSheet(null)}
          date={date}
          challenge={challenge}
          done={todayDone}
        />
      )}
      <NumberSheet
        open={sheet === 'steps'}
        onClose={() => setSheet(null)}
        date={date}
        title={t('today.steps')}
        hint={`${t('sheet.stepsGoal', { n: settings.stepGoal })} · ${t('sheet.stepsHint')}`}
        value={steps}
        unit=""
        decimals={false}
        field="steps"
      />
      <NumberSheet
        open={sheet === 'weight'}
        onClose={() => setSheet(null)}
        date={date}
        title={t('today.weighIn')}
        hint={t('sheet.weightHint')}
        value={daily?.weightKg}
        unit={t('unit.kg')}
        decimals
        field="weightKg"
      />
      <FoodSheet open={sheet === 'food'} onClose={() => setSheet(null)} date={date} food={daily?.food} />
    </Page>
  )
}
