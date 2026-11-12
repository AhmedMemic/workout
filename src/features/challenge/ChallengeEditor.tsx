import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Icon } from '../../components/Icon'
import { Button, Chips, ToggleChip } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { Challenge } from '../../db/db'
import type { TaskUnit } from '../../data/challenges'
import { saveChallenge } from '../../db/queries'
import { challengeName, draftFrom, tasksFromDrafts, type TaskDraft } from '../../logic/challenge'
import { monthKey, today } from '../../logic/dates'
import type { MessageKey } from '../../i18n/en'
import styles from './Challenge.module.css'

const units: TaskUnit[] = ['reps', 'seconds', 'minutes', 'check']
const emptyTask = (): TaskDraft => ({ name: '', unit: 'reps', target: '', rampTo: '' })

interface ChallengeEditorProps {
  month: string
  monthName: string
  /** Undefined = build a new challenge from scratch. */
  challenge?: Challenge
  onClose: () => void
}

/** Edit the month's tasks and targets, or put together a new challenge. Mounted only while open. */
export function ChallengeEditor({ month, monthName, challenge, onClose }: ChallengeEditorProps) {
  const { t, l, lang } = useT()
  const original = challenge?.tasks ?? []
  const originalName = challenge ? l(challengeName(challenge)) : ''
  const [name, setName] = useState(originalName)
  const [drafts, setDrafts] = useState<TaskDraft[]>(() => (challenge ? original.map((task) => draftFrom(task, lang)) : [emptyTask()]))
  const [error, setError] = useState<MessageKey | null>(null)
  const running = month === monthKey(today())

  const change = (i: number, patch: Partial<TaskDraft>) => setDrafts(drafts.map((d, j) => (j === i ? { ...d, ...patch } : d)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    // a task added to a challenge that is already running counts from today, not retroactively
    const result = tasksFromDrafts(drafts, original, lang, challenge && running ? today() : undefined)
    if ('error' in result) return setError(`challenge.err.${result.error}`)
    const typed = name.trim() || t('challenge.customName')
    const finalName = challenge && typed === originalName ? challengeName(challenge) : { en: typed, bs: typed }
    await saveChallenge(month, finalName, result.tasks, !challenge)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={challenge ? t('challenge.edit') : t('challenge.pick', { month: monthName })}>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.textField}>
          <span className="label">{t('challenge.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('challenge.customName')} />
        </label>

        {drafts.map((d, i) => (
          <fieldset key={d.id ?? `new${i}`} className={styles.taskEdit}>
            <div className={styles.taskHead}>
              <label className={styles.textField}>
                <span className="label">{t('challenge.taskName', { n: i + 1 })}</span>
                <input value={d.name} onChange={(e) => change(i, { name: e.target.value })} />
              </label>
              <button
                type="button"
                className={styles.removeTask}
                onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}
                aria-label={t('challenge.removeTask')}
              >
                <Icon name="trash" size={20} />
              </button>
            </div>
            <Chips>
              {units.map((u) => (
                <ToggleChip key={u} selected={d.unit === u} onClick={() => change(i, { unit: u })}>
                  {t(`challenge.unit.${u}`)}
                </ToggleChip>
              ))}
            </Chips>
            {d.unit !== 'check' && (
              <div className={styles.numbers}>
                <label className={styles.textField}>
                  <span className="label">{t('challenge.target')}</span>
                  <input inputMode="numeric" value={d.target} onChange={(e) => change(i, { target: e.target.value })} />
                </label>
                <label className={styles.textField}>
                  <span className="label">{t('challenge.rampTo')}</span>
                  <input inputMode="numeric" value={d.rampTo} onChange={(e) => change(i, { rampTo: e.target.value })} />
                </label>
              </div>
            )}
          </fieldset>
        ))}

        <Button variant="secondary" block onClick={() => setDrafts([...drafts, emptyTask()])}>
          <Icon name="plus" size={18} /> {t('challenge.addTask')}
        </Button>
        <div className="muted">{t('challenge.rampHint')}</div>
        {challenge && running && <div className="muted">{t('challenge.editNote')}</div>}
        {error && <div className={styles.error}>{t(error)}</div>}
        <Button type="submit" block>
          {t('common.save')}
        </Button>
      </form>
    </Sheet>
  )
}
