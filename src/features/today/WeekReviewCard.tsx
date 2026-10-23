import { Button, Card } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { MessageKey } from '../../i18n/en'
import { addDays, formatShort, weekdayLong } from '../../logic/dates'
import type { WeekReview } from '../../logic/weekReview'
import styles from './Today.module.css'

/** Sunday summary of the week with one focus for next week. */
export function WeekReviewCard({ review, onDismiss }: { review: WeekReview; onDismiss?: () => void }) {
  const { t, lang } = useT()
  const { focus } = review
  const focusText =
    focus.key === 'missedDay'
      ? t('review.focus.missedDay', { day: weekdayLong(focus.day, lang) })
      : focus.key === 'strength'
        ? t('review.focus.strength', { n: focus.done })
        : focus.key === 'tooHard'
          ? t('review.focus.tooHard', { n: focus.n })
          : t(`review.focus.${focus.key}` as MessageKey)

  const rows: [string, string][] = [
    [t('review.strength'), `${review.strength} / ${review.strengthPlanned}`],
    [t('review.other'), String(review.otherWorkouts)],
    [
      t('review.weight'),
      review.weightChange === undefined
        ? '–'
        : `${review.weightChange > 0 ? '+' : ''}${review.weightChange} ${t('unit.kg')}`,
    ],
    [t('review.desk'), `${review.deskResets} / 7`],
    [t('review.food'), `${Math.round(review.food * 100)}%`],
    [t('review.challenge'), `${review.challengeDays} / 7`],
  ]
  if (review.stepsLogged > 0) rows.push([t('review.steps'), t('review.stepDays', { a: review.stepDays, b: review.stepsLogged })])

  const total = review.strength + review.otherWorkouts
  const diff = total - review.lastWeekWorkouts

  return (
    <Card>
      <div className="label">
        {t('review.title')} · {formatShort(review.weekStart, lang)}–{formatShort(addDays(review.weekStart, 6), lang)}
      </div>
      <div className={styles.reviewHead}>
        <span className={styles.reviewBig}>{total}</span>
        <span className="muted">
          {t('review.workouts')}
          {diff !== 0 && ` · ${diff > 0 ? '+' : ''}${diff} ${t('review.vsLast')}`}
        </span>
      </div>
      <dl className={styles.reviewRows}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.focus}>
        <div className="label">{t('review.focus')}</div>
        <div>{focusText}</div>
      </div>
      {onDismiss && (
        <Button variant="secondary" block onClick={onDismiss}>
          {t('review.ok')}
        </Button>
      )}
    </Card>
  )
}
