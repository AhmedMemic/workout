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
import { useWorkTimer } from '../../hooks/useWorkTimer'
import { signal } from '../../hooks/device'
import type { RepsStep, RestStep, SetStep, Step, TimedStep, WalkStep } from './steps'
import styles from './Player.module.css'

const sectionKey = (s: Step['section']) => `player.section.${s}` as MessageKey
export const sideKey = (side: 1 | 2) => (side === 1 ? 'player.left' : 'player.right') as MessageKey

function ExerciseHeader({ exerciseId, label, side }: { exerciseId: string; label: string; side?: 1 | 2 }) {
  const { t, l, lang } = useT()
  const ex = exerciseById[exerciseId]
  return (
    <div className={styles.header}>
      <div className="label">{label}</div>
      <h1 className={styles.name}>{l(ex.name)}</h1>
      <div className={styles.otherName}>{ex.name[lang === 'en' ? 'bs' : 'en']}</div>
      {side && <div className={styles.side}>{t(sideKey(side))}</div>}
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
  if (!step || step.type === 'rest' || step.type === 'walk') return null
  return <UpNextCard {...describeStep(step, levels, t, l)} />
}

function UpNextCard({ title, meta }: { title: string; meta: string }) {
  const { t } = useT()
  return (
    <div className={styles.upNext}>
      <div className="label">{t('player.upNext')}</div>
      <div className={styles.upNextName}>{title}</div>
      <div className="muted">{meta}</div>
    </div>
  )
}

type T = ReturnType<typeof useT>['t']
type L = ReturnType<typeof useT>['l']

/** Name + short target line for a step (Up next card, session list). */
export function describeStep(step: Step, levels: Levels, t: T, l: L): { title: string; meta: string } {
  switch (step.type) {
    case 'set': {
      const id = resolveSlot(step.slot, levels)
      const target = targetFor(step.slot, id)
      const unit = t(target.measure === 'time' ? 'unit.seconds' : 'unit.reps')
      return {
        title: l(exerciseById[id].name),
        meta: `${t('player.set', { a: step.setNo, b: step.totalSets })} · ${target.min}–${target.max} ${unit}`,
      }
    }
    case 'timed':
      return {
        title: l(exerciseById[step.exerciseId].name),
        meta: [
          step.seconds >= 60 ? formatClock(step.seconds) : `${step.seconds} ${t('unit.seconds')}`,
          step.side && t(sideKey(step.side)),
          step.round && t('player.round', { a: step.round, b: step.totalRounds! }),
        ]
          .filter(Boolean)
          .join(' · '),
      }
    case 'reps':
      return {
        title: l(exerciseById[step.exerciseId].name),
        meta: [
          `${step.reps} ${t('unit.reps')}${step.perSide && !step.side ? ` ${t('player.perSide')}` : ''}`,
          step.side && t(sideKey(step.side)),
          step.round && t('player.round', { a: step.round, b: step.totalRounds! }),
        ]
          .filter(Boolean)
          .join(' · '),
      }
    case 'rest':
      return { title: t('player.rest'), meta: `${step.seconds} ${t('unit.seconds')}` }
    case 'walk':
      return { title: l(exerciseById['brisk-walk'].name), meta: `${step.minutes} ${t('unit.minutes')}` }
  }
}

// ── Timer display + controls (get ready → work → stops at 0) ────

type WorkTimer = ReturnType<typeof useWorkTimer>

function TimerPanel({ timer, startLabel }: { timer: WorkTimer; startLabel: string }) {
  const { t } = useT()
  const ready = timer.phase === 'ready'
  return (
    <>
      <div className={styles.centerBlock}>
        <div className={styles.timerLabel}>{ready ? t('player.getReady') : ' '}</div>
        <div className={`${styles.huge} ${ready ? styles.accent : ''}`}>{ready ? timer.left : formatClock(timer.left)}</div>
      </div>
      {timer.phase === 'idle' ? (
        <Button block onClick={timer.start}>
          <Icon name="play" size={18} /> {startLabel}
        </Button>
      ) : (
        <div className={styles.twoCol}>
          <Button variant="secondary" onClick={timer.running ? timer.pause : timer.resume} disabled={timer.phase === 'done'}>
            {timer.running ? t('player.pause') : t('player.resume')}
          </Button>
          <Button variant="secondary" onClick={timer.reset}>
            {t('player.reset')}
          </Button>
        </div>
      )}
    </>
  )
}

// ── Strength set (logged) ───────────────────────────────────────

interface SetViewProps {
  step: SetStep
  side?: 1 | 2
  levels: Levels
  sets: LoggedSet[]
  next: Step | undefined
  readySec: number
  onLog: (set: LoggedSet) => void
}

export function SetView({ step, side, levels, sets, next, readySec, onLog }: SetViewProps) {
  const { t, l } = useT()
  const exerciseId = resolveSlot(step.slot, levels)
  const ex = exerciseById[exerciseId]
  const target = targetFor(step.slot, exerciseId)
  const previous = [...sets].reverse().find((s) => s.slotId === step.slot.id && s.exerciseId === exerciseId)
  // start low: logging the top of the range moves you up a level, so it should be a deliberate tap
  const initial = previous ? (previous.reps ?? previous.seconds ?? target.min) : target.min
  const [value, setValue] = useState(initial)
  const [switched, setSwitched] = useState<string | null>(null)
  const isTime = target.measure === 'time'
  const stepSize = isTime ? 5 : 1

  const log = (amount: number) =>
    onLog({
      slotId: step.slot.id,
      exerciseId,
      setNo: step.setNo,
      ...(side && { side }),
      ...(isTime ? { seconds: amount } : { reps: amount }),
    })

  const timer = useWorkTimer({ seconds: value, readySec, onFinish: () => log(value) })
  const timing = timer.phase !== 'idle'

  const shift = async (delta: number) => {
    if (!step.slot.chain) return
    const chain = step.slot.chain
    const nextStep = Math.min(Math.max(levelOf(chain, levels) + delta, 0), chains[chain].steps.length - 1)
    await setLevel(chain, nextStep)
    const newId = chains[chain].steps[nextStep]
    timer.reset()
    setSwitched(l(exerciseById[newId].name))
    setValue(targetFor(step.slot, newId).min)
  }

  const isLastSide = !side || side === 2
  const logLabel =
    !isLastSide ? t('player.logSide') : step.restAfter ? t('player.logSetRest', { n: step.restAfter }) : t('player.logSet')

  return (
    <>
      <ExerciseHeader
        exerciseId={exerciseId}
        side={side}
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

      {isTime && timing ? (
        <TimerPanel timer={timer} startLabel={t('player.startTimer')} />
      ) : (
        <>
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
              <div className={styles.big}>{value}</div>
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
            <Button block onClick={timer.start}>
              <Icon name="play" size={18} /> {t('player.startTimer')}
            </Button>
          )}
        </>
      )}

      <Button
        block
        variant={isTime ? 'secondary' : 'primary'}
        onClick={() => log(isTime && timer.phase === 'work' ? timer.workElapsed : value)}
      >
        {logLabel}
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
        {side === 1 ? <UpNextCard title={l(ex.name)} meta={t('player.right')} /> : <UpNext step={next} levels={levels} />}
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
      <ExerciseHeader exerciseId={step.exerciseId} label={label} side={step.side} />
      <div className={styles.centerBlock}>
        <div className={styles.big}>{step.reps}</div>
        <div className="muted">
          {t('unit.reps')}
          {step.perSide && !step.side && ` ${t('player.perSide')}`}
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

interface TimedViewProps {
  step: TimedStep
  next: Step | undefined
  levels: Levels
  readySec: number
  onDone: () => void
}

export function TimedView({ step, next, levels, readySec, onDone }: TimedViewProps) {
  const { t, l } = useT()
  const timer = useWorkTimer({ seconds: step.seconds, readySec, autoStart: true, onFinish: onDone })
  const label = [
    t(sectionKey(step.section)),
    step.round && t('player.round', { a: step.round, b: step.totalRounds! }),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <ExerciseHeader exerciseId={step.exerciseId} label={label} side={step.side} />
      {step.focus && <div className={styles.focus}>{l(step.focus)}</div>}
      <TimerPanel timer={timer} startLabel={t('player.startTimer')} />
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
        <Button variant="secondary" onClick={timer.running ? timer.pause : timer.resume}>
          {timer.running ? t('player.pause') : t('player.resume')}
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
