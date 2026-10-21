import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Page } from '../../components/Page'
import { Sheet } from '../../components/Sheet'
import { Button, Card, Chips, ToggleChip } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { MessageKey } from '../../i18n/en'
import { templates } from '../../data/templates'
import { db, type TestResult } from '../../db/db'
import { addDays, formatDay, startOfWeek, today as todayISO } from '../../logic/dates'
import { formatClock } from '../../hooks/useCountdown'
import styles from './Progress.module.css'

const toeOptions = ['knee', 'shin', 'ankle', 'toes', 'floor'] as const
type Toe = (typeof toeOptions)[number]

const numericTests: { key: 'pushups' | 'plankSec' | 'squats60' | 'waistCm' | 'hangSec'; label: MessageKey }[] = [
  { key: 'pushups', label: 'test.pushups' },
  { key: 'plankSec', label: 'test.plank' },
  { key: 'squats60', label: 'test.squats' },
  { key: 'waistCm', label: 'test.waist' },
  { key: 'hangSec', label: 'test.hang' },
]

/** Average weight over the 7 days ending at `date`. */
function sevenDayAverage(entries: { date: string; kg: number }[], date: string): number | undefined {
  const from = addDays(date, -6)
  const window = entries.filter((e) => e.date >= from && e.date <= date)
  if (!window.length) return undefined
  return Math.round((window.reduce((s, e) => s + e.kg, 0) / window.length) * 10) / 10
}

function TestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT()
  const [toe, setToe] = useState<Toe | undefined>()

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const result: TestResult = { date: todayISO(), toeTouch: toe }
    for (const { key } of numericTests) {
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
        {numericTests.map(({ key, label }) => (
          <label key={key} className={styles.field}>
            <span>{t(label)}</span>
            <input name={key} type="text" inputMode="decimal" />
          </label>
        ))}
        <div className={styles.field}>
          <span>{t('test.toeTouch')}</span>
        </div>
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

export function ProgressPage() {
  const { t, l, lang } = useT()
  const date = todayISO()
  const [adding, setAdding] = useState(false)

  const data = useLiveQuery(async () => {
    const daily = await db.daily.orderBy('date').toArray()
    const sessions = await db.sessions.where('status').equals('done').reverse().sortBy('startedAt')
    const tests = await db.tests.orderBy('date').reverse().toArray()
    return { daily, sessions, tests }
  }, [])
  if (!data) return null

  const weights = data.daily.filter((d) => d.weightKg).map((d) => ({ date: d.date, kg: d.weightKg! }))
  const latest = weights.at(-1)
  const avg = sevenDayAverage(weights, date)
  const change = latest && weights.length > 1 ? Math.round(((avg ?? latest.kg) - weights[0].kg) * 10) / 10 : undefined
  const weekStart = startOfWeek(date)
  const thisWeek = data.sessions.filter((s) => s.date >= weekStart).length

  return (
    <Page title={t('progress.title')}>
      <Card>
        <div className="label">{t('progress.weight')}</div>
        {latest ? (
          <>
            <div className={styles.stats}>
              <div>
                <div className={styles.value}>{latest.kg}</div>
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
            <ul className={styles.list}>
              {weights.slice(-10).reverse().map((w) => (
                <li key={w.date}>
                  <span className="muted">{formatDay(w.date, lang)}</span>
                  <span>
                    {w.kg} {t('unit.kg')}
                  </span>
                </li>
              ))}
            </ul>
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
            <div className={styles.value}>{data.sessions.length}</div>
            <div className="muted">{t('progress.total')}</div>
          </div>
        </div>
        {data.sessions.length === 0 ? (
          <div className="muted">{t('progress.noSessions')}</div>
        ) : (
          <ul className={styles.list}>
            {data.sessions.slice(0, 15).map((s) => (
              <li key={s.id}>
                <span className="muted">{formatDay(s.date, lang)}</span>
                <span className={styles.grow}>{l(templates[s.templateId].name)}</span>
                <span className="muted">{s.endedAt ? formatClock(Math.round((s.endedAt - s.startedAt) / 1000)) : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="label">{t('progress.tests')}</div>
        <div className="muted">{t('progress.testsHint')}</div>
        {data.tests.length === 0 ? (
          <div className="muted">{t('progress.noTests')}</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  {data.tests.map((r) => (
                    <th key={r.id}>{formatDay(r.date, lang)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numericTests.map(({ key, label }) => (
                  <tr key={key}>
                    <th>{t(label)}</th>
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
        )}
        <Button variant="secondary" block onClick={() => setAdding(true)}>
          {t('progress.addTest')}
        </Button>
      </Card>

      <TestSheet open={adding} onClose={() => setAdding(false)} />
    </Page>
  )
}
