import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sheet } from '../../components/Sheet'
import { CheckRow } from '../../components/CheckRow'
import { Button, Chips, ToggleChip, buttonClass } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { habits, swaps } from '../../data/habits'
import type { Challenge } from '../../db/db'
import { markSessionDone, toggleChallengeTask, toggleFood, updateDaily } from '../../db/queries'
import { templates, type TemplateId } from '../../data/templates'
import { daysInMonth, dayOfMonth, formatDay, monthKey, type ISODate } from '../../logic/dates'
import { targetForDay, tasksOn } from '../../logic/challenge'
import type { TaskUnit } from '../../data/challenges'
import type { MessageKey } from '../../i18n/en'
import styles from './Today.module.css'

interface BaseProps {
  open: boolean
  onClose: () => void
  date: ISODate
}

export function DeskResetSheet({ open, onClose, date, done }: BaseProps & { done: boolean }) {
  const { t } = useT()
  return (
    <Sheet open={open} onClose={onClose} title={t('today.deskReset')}>
      <Link to="/workout/deskReset" className={buttonClass('primary', true)}>
        {t('sheet.deskFull')}
      </Link>
      <Link to="/workout/deskResetShort" className={buttonClass('secondary', true)}>
        {t('sheet.deskShort')}
      </Link>
      <Button
        variant="secondary"
        block
        onClick={async () => {
          await updateDaily(date, { deskReset: !done })
          onClose()
        }}
      >
        {done ? t('sheet.markUndone') : t('sheet.markDone')}
      </Button>
    </Sheet>
  )
}

interface NumberSheetProps extends BaseProps {
  title: string
  hint: string
  value: number | undefined
  unit: string
  decimals: boolean
  field: 'steps' | 'weightKg'
}

export function NumberSheet({ open, onClose, date, title, hint, value, unit, decimals, field }: NumberSheetProps) {
  const { t } = useT()
  const input = useRef<HTMLInputElement>(null)

  const save = async (v: number | undefined) => {
    await updateDaily(date, { [field]: v })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          const text = input.current?.value.trim() ?? ''
          const n = Number(text.replace(',', '.'))
          if (text && Number.isFinite(n) && n > 0) void save(decimals ? Math.round(n * 10) / 10 : Math.round(n))
        }}
      >
        <label className={styles.numberField}>
          <input
            ref={input}
            type="text"
            inputMode={decimals ? 'decimal' : 'numeric'}
            defaultValue={value ?? ''}
            placeholder={decimals ? '84.6' : '7000'}
            autoFocus
            aria-label={title}
          />
          <span className="muted">{unit}</span>
        </label>
        <div className="muted">{hint}</div>
        <Button type="submit" block>
          {t('common.save')}
        </Button>
        {value !== undefined && (
          <Button variant="secondary" block onClick={() => void save(undefined)}>
            {t('common.clear')}
          </Button>
        )}
      </form>
    </Sheet>
  )
}

export function FoodSheet({ open, onClose, date, food }: BaseProps & { food: Record<string, boolean> | undefined }) {
  const { t, l } = useT()
  return (
    <Sheet open={open} onClose={onClose} title={t('today.food')}>
      <div className={styles.list}>
        {habits.map((h) => (
          <div key={h.id}>
            <CheckRow state={food?.[h.id] ? 'done' : 'empty'} label={l(h.name)} onClick={() => void toggleFood(date, h.id)} />
            <div className={styles.subtext}>{l(h.target)}</div>
          </div>
        ))}
      </div>
      <div className="label">{t('sheet.swaps')}</div>
      <ul className={styles.swaps}>
        {swaps.map((s, i) => (
          <li key={i}>{l(s)}</li>
        ))}
      </ul>
    </Sheet>
  )
}

const unitKey: Record<TaskUnit, MessageKey | null> = {
  reps: 'unit.reps',
  seconds: 'unit.seconds',
  minutes: 'unit.minutes',
  check: null,
}

export function ChallengeSheet({
  open,
  onClose,
  date,
  challenge,
  done,
  showCalendarLink = true,
}: BaseProps & { challenge: Challenge; done: string[]; showCalendarLink?: boolean }) {
  const { t, l, lang } = useT()
  const days = daysInMonth(monthKey(date))
  const day = dayOfMonth(date)
  return (
    <Sheet open={open} onClose={onClose} title={t('today.challenge')}>
      <div className="muted">{formatDay(date, lang)} · {t('today.dayOf', { d: day, n: days })}</div>
      <div className={styles.list}>
        {tasksOn(challenge.tasks, date).map((task) => {
          const key = unitKey[task.unit]
          const value = key ? `${targetForDay(task, day, days, challenge.startDay)} ${t(key)}` : undefined
          return (
            <CheckRow
              key={task.id}
              state={done.includes(task.id) ? 'done' : 'empty'}
              label={l(task.name)}
              value={value}
              onClick={() => void toggleChallengeTask(date, task.id)}
            />
          )
        })}
      </div>
      <div className="muted">{t('sheet.splitOk')}</div>
      {showCalendarLink && (
        <Link to="/challenge" className={buttonClass('secondary', true)}>
          {t('sheet.openChallenge')}
        </Link>
      )}
    </Sheet>
  )
}

/** Log a walk or cardio session that was done without the app running. */
export function MarkDoneSheet({ open, onClose, date, options }: BaseProps & { options: TemplateId[] }) {
  const { t, l, lang } = useT()
  const [picked, setPicked] = useState<TemplateId | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const id = picked && options.includes(picked) ? picked : options[0]
  if (!id) return null
  const template = templates[id]
  const isWalk = template.kind === 'walk'

  return (
    <Sheet open={open} onClose={onClose} title={`${t('done.title')} · ${formatDay(date, lang)}`}>
      <form
        className={styles.form}
        onSubmit={async (e) => {
          e.preventDefault()
          let minutes: number | undefined
          if (isWalk) {
            const n = Math.round(Number(input.current?.value.trim().replace(',', '.')))
            if (!Number.isFinite(n) || n <= 0) return
            minutes = n
          }
          await markSessionDone(date, id, minutes)
          onClose()
        }}
      >
        {options.length > 1 && (
          <>
            <div className="label">{t('done.which')}</div>
            <Chips>
              {options.map((o) => (
                <ToggleChip key={o} selected={o === id} onClick={() => setPicked(o)}>
                  {l(templates[o].name)}
                </ToggleChip>
              ))}
            </Chips>
          </>
        )}
        {isWalk && (
          <>
            <div className="label">{t('done.minutes')}</div>
            <label className={styles.numberField}>
              <input
                key={id}
                ref={input}
                type="text"
                inputMode="numeric"
                defaultValue={template.minutes}
                aria-label={t('done.minutes')}
              />
              <span className="muted">{t('unit.minutes')}</span>
            </label>
          </>
        )}
        <div className="muted">{t('done.hint')}</div>
        <Button type="submit" block>
          {t('sheet.markDone')}
        </Button>
      </form>
    </Sheet>
  )
}
