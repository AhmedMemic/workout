import { useState } from 'react'
import { Button, Chip, Chips } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n/I18nProvider'
import type { MessageKey } from '../../i18n/en'
import { exerciseById, youtubeUrl } from '../../data/exercises'
import { equipmentLabels } from '../../data/labels'
import { chains } from '../../data/chains'
import type { LoggedSet } from '../../db/db'
import { setLevel } from '../../db/queries'
import { levelOf, resolveSlot, targetFor, type Levels } from '../../logic/progression'
import { formatClock, useCountdown, useElapsed } from '../../hooks/useCountdown'
import { signal } from '../../hooks/device'
import type { RepsStep, RestStep, SetStep, Step, TimedStep, WalkStep } from './steps'
import styles from './Player.module.css'

const sectionKey = (s: Step['section']) => `player.section.${s}` as MessageKey

function ExerciseHeader({ exerciseId, label }: { exerciseId: string; label: string }) {
  const { l, lang } = useT()
  const ex = exerciseById[exerciseId]
  return (
    <div className={styles.header}>
      <div className="label">{label}</div>
      <h1 className={styles.name}>{l(ex.name)}</h1>
      <div className={styles.otherName}>{ex.name[lang === 'en' ? 'bs' : 'en']}</div>
    </div>
  )
}

function HowTo({ exerciseId }: { exerciseId: string }) {
  const { t } = useT()
  return (
    <a className={styles.howTo} href={youtubeUrl(exerciseById[exerciseId])} target="_blank" rel="noreferrer">
      {t('player.howTo')}
    </a>
  )
}

export function UpNext({ step, levels }: { step: Step | undefined; levels: Levels }) {
  const { t, l } = useT()
  if (!step || step.type === 'rest') return null
  let title = ''
  let meta = ''
  if (step.type === 'set') {
    const id = resolveSlot(step.slot, levels)
    const target = targetFor(step.slot, id)
    title = l(exerciseById[id].name)
    meta = `${target.min}–${target.max} ${t(target.measure === 'time' ? 'unit.seconds' : 'unit.reps')}`
  } else if (step.type === 'walk') {
    return null
  } else {
    title = l(exerciseById[step.exerciseId].name)
    meta =
      step.type === 'timed'
        ? step.seconds >= 60
          ? formatClock(step.seconds)
          : `${step.seconds} ${t('unit.seconds')}`
        : `${step.reps} ${t('unit.reps')}`
  }
  return (
    <div className={styles.upNext}>
      <div className="label">{t('player.upNext')}</div>
      <div className={styles.upNextName}>{title}</div>
      <div className="muted">{meta}</div>
    </div>
  )
}

// ── Strength set (logged) ───────────────────────────────────────

interface SetViewProps {
  step: SetStep
  levels: Levels
  sets: LoggedSet[]
  next: Step | undefined
  onLog: (set: LoggedSet) => void
}

export function SetView({ step, levels, sets, next, onLog }: SetViewProps) {
  const { t, l } = useT()
  const exerciseId = resolveSlot(step.slot, levels)
  const ex = exerciseById[exerciseId]
  const target = targetFor(step.slot, exerciseId)
  const previous = [...sets].reverse().find((s) => s.slotId === step.slot.id && s.exerciseId === exerciseId)
  // start low: logging the top of the range moves you up a level, so it should be a deliberate tap
  const initial = previous ? (previous.reps ?? previous.seconds ?? target.min) : target.min
  const [value, setValue] = useState(initial)
  const [switched, setSwitched] = useState<string | null>(null)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const elapsed = useElapsed(timerStart)
  const isTime = target.measure === 'time'
  const stepSize = isTime ? 5 : 1

  const shift = async (delta: number) => {
    if (!step.slot.chain) return
    const chain = step.slot.chain
    const nextStep = Math.min(Math.max(levelOf(chain, levels) + delta, 0), chains[chain].steps.length - 1)
    await setLevel(chain, nextStep)
    const newId = chains[chain].steps[nextStep]
    setSwitched(l(exerciseById[newId].name))
    setValue(targetFor(step.slot, newId).min)
  }

  return (
    <>
      <ExerciseHeader
        exerciseId={exerciseId}
        label={`${step.slot.id.slice(1)} · ${t('player.set', { a: step.setNo, b: step.totalSets })}`}
      />
      <Chips>
        {ex.equipment.slice(0, 2).map((eq) => (
          <Chip key={eq}>{l(equipmentLabels[eq])}</Chip>
        ))}
        <Chip>
          {target.min}–{target.max} {t(isTime ? 'unit.seconds' : 'unit.reps')}
          {target.perSide && ` ${t('player.perSide')}`}
        </Chip>
        {!isTime && <Chip>3 s ↓</Chip>}
      </Chips>
      {switched && <div className={styles.toast}>{t('player.switched', { name: switched })}</div>}

      <div className={styles.counter}>
        <button
          type="button"
          className={styles.round}
          aria-label={t('player.lessReps')}
          onClick={() => setValue((v) => Math.max(0, v - stepSize))}
        >
          <Icon name="minus" />
        </button>
        <div className={styles.counterValue}>
          <div className={styles.big}>{timerStart !== null ? elapsed : value}</div>
          <div className="muted">{t(isTime ? 'unit.seconds' : 'unit.reps')}</div>
        </div>
        <button
          type="button"
          className={styles.round}
          aria-label={t('player.moreReps')}
          onClick={() => setValue((v) => v + stepSize)}
        >
          <Icon name="plus" />
        </button>
      </div>

      {isTime && (
        <Button
          variant="secondary"
          block
          onClick={() => {
            if (timerStart === null) setTimerStart(Date.now())
            else {
              setValue(elapsed)
              setTimerStart(null)
            }
          }}
        >
          {timerStart === null ? t('player.startTimer') : t('player.stopTimer')}
        </Button>
      )}

      <Button
        block
        onClick={() =>
          onLog({
            slotId: step.slot.id,
            exerciseId,
            setNo: step.setNo,
            ...(isTime ? { seconds: timerStart !== null ? elapsed : value } : { reps: value }),
          })
        }
      >
        {step.restAfter ? t('player.logSetRest', { n: step.restAfter }) : t('player.logSet')}
      </Button>

      {step.slot.chain && (
        <div className={styles.twoCol}>
          <Button variant="secondary" onClick={() => void shift(-1)}>
            {t('player.tooHard')}
          </Button>
          <Button variant="secondary" onClick={() => void shift(1)}>
            {t('player.tooEasy')}
          </Button>
        </div>
      )}

      <div className={styles.footer}>
        <UpNext step={next} levels={levels} />
        <HowTo exerciseId={exerciseId} />
      </div>
    </>
  )
}

// ── Guided reps (not logged) ────────────────────────────────────

export function RepsView({ step, next, levels, onDone }: { step: RepsStep; next: Step | undefined; levels: Levels; onDone: () => void }) {
  const { t } = useT()
  const label = [
    t(sectionKey(step.section)),
    step.round && t('player.round', { a: step.round, b: step.totalRounds! }),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <ExerciseHeader exerciseId={step.exerciseId} label={label} />
      <div className={styles.centerBlock}>
        <div className={styles.big}>{step.reps}</div>
        <div className="muted">
          {t('unit.reps')}
          {step.perSide && ` ${t('player.perSide')}`}
        </div>
      </div>
      <Button block onClick={onDone}>
        {t('player.done')}
      </Button>
      <div className={styles.footer}>
        <UpNext step={next} levels={levels} />
        <HowTo exerciseId={step.exerciseId} />
      </div>
    </>
  )
}

// ── Timed work ──────────────────────────────────────────────────

export function TimedView({ step, next, levels, onDone }: { step: TimedStep; next: Step | undefined; levels: Levels; onDone: () => void }) {
  const { t, l } = useT()
  const timer = useCountdown(step.seconds, () => {
    signal(2)
    onDone()
  })
  const label = [
    t(sectionKey(step.section)),
    step.round && t('player.round', { a: step.round, b: step.totalRounds! }),
    step.side && t('player.side', { n: step.side }),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <ExerciseHeader exerciseId={step.exerciseId} label={label} />
      {step.focus && <div className={styles.focus}>{l(step.focus)}</div>}
      <div className={styles.centerBlock}>
        <div className={styles.huge}>{formatClock(timer.left)}</div>
      </div>
      <div className={styles.twoCol}>
        <Button variant="secondary" onClick={timer.running ? timer.pause : timer.resume}>
          {timer.running ? t('player.pause') : t('player.resume')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('player.skip')}
        </Button>
      </div>
      <div className={styles.footer}>
        <UpNext step={next} levels={levels} />
        <HowTo exerciseId={step.exerciseId} />
      </div>
    </>
  )
}

// ── Rest ────────────────────────────────────────────────────────

export function RestView({ step, next, levels, onDone }: { step: RestStep; next: Step | undefined; levels: Levels; onDone: () => void }) {
  const { t } = useT()
  const timer = useCountdown(step.seconds, () => {
    signal(3)
    onDone()
  })
  return (
    <>
      <div className={styles.header}>
        <div className="label">{t(sectionKey(step.section))}</div>
        <h1 className={styles.name}>{t('player.rest')}</h1>
      </div>
      <div className={styles.centerBlock}>
        <div className={`${styles.huge} ${styles.accent}`}>{formatClock(timer.left)}</div>
      </div>
      <div className={styles.twoCol}>
        <Button variant="secondary" onClick={() => timer.add(15)}>
          {t('player.add15')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('player.skip')}
        </Button>
      </div>
      <div className={styles.footer}>
        <UpNext step={next} levels={levels} />
      </div>
    </>
  )
}

// ── Walk ────────────────────────────────────────────────────────

export function WalkView({ startedAt, onFinish }: { step: WalkStep; startedAt: number; onFinish: (minutes: number) => void }) {
  const { t } = useT()
  const elapsed = useElapsed(startedAt)
  return (
    <>
      <ExerciseHeader exerciseId="brisk-walk" label={t('player.section.main')} />
      <div className={styles.centerBlock}>
        <div className={styles.huge}>{formatClock(elapsed)}</div>
        <div className="muted">{t('player.walkText')}</div>
      </div>
      <Button block onClick={() => onFinish(Math.max(1, Math.round(elapsed / 60)))}>
        {t('player.finish')}
      </Button>
    </>
  )
}
