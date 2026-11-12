import { Button, Card } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { exerciseById } from '../../data/exercises'
import { formatMonth } from '../../logic/dates'
import type { MonthReview } from '../../logic/monthReview'
import styles from './Today.module.css'

const signed = (n: number) => `${n > 0 ? '+' : ''}${n}`

/** The month at a glance, shown early in the next month and on Progress. */
export function MonthReviewCard({ review, onDismiss }: { review: MonthReview; onDismiss?: () => void }) {
  const { t, l, lang } = useT()
  const r = review
  const diff = r.workouts - r.lastMonthWorkouts

  const rows: [string, string][] = [
    [t('review.strength'), `${r.strength} / ${r.strengthPlanned}`],
    [t('month.active'), `${r.activeDays} / ${r.days}`],
    [t('month.levelUps'), String(r.levelUps.length)],
    [t('month.records'), String(r.records)],
  ]
  if (r.challenge) rows.push([t('review.challenge'), `${r.challenge.done} / ${r.challenge.of}`])
  if (r.weightChange !== undefined) rows.push([t('review.weight'), `${signed(r.weightChange)} ${t('unit.kg')}`])
  if (r.waistChange !== undefined) rows.push([t('month.waist'), `${signed(r.waistChange)} ${t('unit.cm')}`])
  if (r.standMin > 0) rows.push([t('month.standing'), t('month.hours', { n: Math.round((r.standMin / 60) * 10) / 10 })])
  rows.push([t('review.desk'), String(r.deskResets)])

  const message =
    r.levelUps.length > 1
      ? t('month.msg.levelUps', { n: r.levelUps.length })
      : r.levelUps.length === 1
        ? t('month.msg.levelUp')
      : r.strengthPlanned > 0 && r.strength >= r.strengthPlanned * 0.8
        ? t('month.msg.consistent', { a: r.strength, b: r.strengthPlanned })
        : r.activeDays * 2 >= r.days
          ? t('month.msg.active')
          : t('month.msg.slow')

  return (
    <Card>
      <div className="label">{t('month.title', { month: formatMonth(`${r.month}-01`, lang) })}</div>
      <div className={styles.reviewHead}>
        <span className={styles.reviewBig}>{r.workouts}</span>
        <span className="muted">
          {t('review.workouts')}
          {diff !== 0 && ` · ${signed(diff)} ${t('month.vsLast')}`}
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
      {r.levelUps.length > 0 && (
        <div className="muted">{t('month.newSteps', { list: r.levelUps.map((id) => l(exerciseById[id].name)).join(', ') })}</div>
      )}
      <div className={styles.focus}>
        <div>{message}</div>
      </div>
      {onDismiss && (
        <Button variant="secondary" block onClick={onDismiss}>
          {t('review.ok')}
        </Button>
      )}
    </Card>
  )
}
