import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Chips, ToggleChip } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { GoalMetric } from '../../db/db'
import { addGoal } from '../../db/queries'
import { lowerIsBetter } from '../../logic/goals'
import { today } from '../../logic/dates'
import { goalMetrics, metricInfo } from './metrics'
import styles from './Progress.module.css'

const parse = (raw: FormDataEntryValue | null) => {
  const s = String(raw ?? '').replace(',', '.').trim()
  const n = Number(s)
  return s && Number.isFinite(n) ? n : undefined
}

interface GoalSheetProps {
  open: boolean
  onClose: () => void
  current: (metric: GoalMetric) => number | undefined
}

export function GoalSheet({ open, onClose, current }: GoalSheetProps) {
  const { t } = useT()
  const [metric, setMetric] = useState<GoalMetric>('weight')
  const [error, setError] = useState<string | null>(null)
  const now = current(metric)
  const unit = t(metricInfo[metric].unit)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const target = parse(form.get('target'))
    const start = now ?? parse(form.get('start'))
    if (target === undefined || start === undefined) return setError(t('goal.missing'))
    if (lowerIsBetter(metric) ? target >= start : target <= start) return setError(t('goal.direction'))
    const deadline = String(form.get('deadline') ?? '') || undefined
    await addGoal({ metric, target, start, createdAt: today(), deadline })
    setError(null)
    e.currentTarget.reset()
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('goal.add')}>
      <form className={styles.form} onSubmit={submit}>
        <Chips>
          {goalMetrics.map((m) => (
            <ToggleChip key={m} selected={metric === m} onClick={() => setMetric(m)}>
              {t(metricInfo[m].label)}
            </ToggleChip>
          ))}
        </Chips>
        {now !== undefined ? (
          <div className="muted">{t('goal.now', { v: `${now} ${unit}` })}</div>
        ) : (
          <label className={styles.field}>
            <span>{t('goal.start', { unit })}</span>
            <input name="start" type="text" inputMode="decimal" />
          </label>
        )}
        <label className={styles.field}>
          <span>{t('goal.target', { unit })}</span>
          <input name="target" type="text" inputMode="decimal" required />
        </label>
        <label className={styles.field}>
          <span>{t('goal.deadline')}</span>
          <input name="deadline" type="date" className={styles.dateInput} />
        </label>
        {error && <div className={styles.error}>{error}</div>}
        <Button type="submit" block>
          {t('common.save')}
        </Button>
      </form>
    </Sheet>
  )
}
