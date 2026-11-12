import { BarChart } from '../../components/charts'
import { Card } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { DailyLog } from '../../db/db'
import { formatDay, formatShort, startOfWeek, type ISODate } from '../../logic/dates'
import { standHistory } from '../../logic/standing'
import styles from './Progress.module.css'

/** Standing minutes over the last two weeks. Hidden until the desk has been used. */
export function StandCard({ daily, date, goal }: { daily: DailyLog[]; date: ISODate; goal: number }) {
  const { t, lang } = useT()
  if (!daily.some((d) => d.standMin)) return null
  const days = standHistory(daily, date)
  const weekStart = startOfWeek(date)
  const thisWeek = days.filter((d) => d.date >= weekStart)
  const total = thisWeek.reduce((n, d) => n + d.min, 0)
  const used = days.filter((d) => d.min > 0)
  const avg = used.length ? Math.round(used.reduce((n, d) => n + d.min, 0) / used.length) : 0
  const hit = thisWeek.filter((d) => d.min >= goal).length

  return (
    <Card>
      <div className="label">{t('desk.title')}</div>
      <div className={styles.stats}>
        <div>
          <div className={styles.value}>{total}</div>
          <div className="muted">{t('stand.weekMin')}</div>
        </div>
        <div>
          <div className={styles.value}>{avg}</div>
          <div className="muted">{t('stand.avg')}</div>
        </div>
        <div>
          <div className={styles.value}>{hit}</div>
          <div className="muted">{t('stand.goalDays', { n: goal })}</div>
        </div>
      </div>
      <BarChart
        bars={days.map((d) => ({ key: d.date, label: formatShort(d.date, lang), value: d.min }))}
        label={t('stand.chart')}
        describe={(v, label) => `${label}: ${v} ${t('unit.minutes')}`}
      />
      <div className="muted">{t('stand.since', { date: formatDay(days[0].date, lang) })}</div>
    </Card>
  )
}
