import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n/I18nProvider'
import { useDoneSessions } from '../../db/queries'
import { weekday, weekdayName, type ISODate } from '../../logic/dates'
import { weekProgress, type DayState } from '../../logic/weekProgress'
import type { MessageKey } from '../../i18n/en'
import styles from './Today.module.css'

const stateKey = (s: DayState) => `week.${s}` as MessageKey

/** This week's planned workouts as a Mon–Sun row; each state has its own mark, not just a colour. */
export function WeekStrip({ date }: { date: ISODate }) {
  const { t, lang } = useT()
  const sessions = useDoneSessions()
  if (!sessions) return null
  const week = weekProgress(sessions, date)

  return (
    <Link to="/plan" className={styles.strip}>
      <div className={styles.stripHead}>
        <span className={styles.stripTitle}>{t('week.title')}</span>
        <span>
          <strong className={styles.weekCount}>{week.done}</strong>
          <span className="muted"> / {t('week.of', { n: week.planned })}</span>
        </span>
      </div>
      <ol className={styles.weekDays}>
        {week.days.map((d) => (
          <li key={d.date} className={styles.weekDay} aria-label={`${weekdayName(weekday(d.date), lang)}: ${t(stateKey(d.state))}`}>
            <span className={styles.weekName}>{weekdayName(weekday(d.date), lang)}</span>
            <span className={`${styles.weekMark} ${styles[`week_${d.state}`]}`} aria-hidden="true">
              {d.state === 'done' && <Icon name="check" size={18} />}
              {d.state === 'missed' && <Icon name="close" size={14} />}
              {d.state === 'rest' && <Icon name="minus" size={14} />}
            </span>
          </li>
        ))}
      </ol>
    </Link>
  )
}
