import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, buttonClass } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Sheet } from '../../components/Sheet'
import { useT } from '../../i18n/I18nProvider'
import { templates, type TemplateId } from '../../data/templates'
import { exerciseById } from '../../data/exercises'
import type { LoggedSet, Session } from '../../db/db'
import { saveSetting, useSettings } from '../../db/settings'
import { useLevels } from '../../db/queries'
import { today } from '../../logic/dates'
import { programPosition, setsFor } from '../../logic/schedule'
import { formatClock, useElapsed } from '../../hooks/useCountdown'
import { configureVoice, say, unlockAudio, useWakeLock } from '../../hooks/device'
import { resolveSlot, targetFor, type Levels } from '../../logic/progression'
import { buildSteps, nextWorkStep, prevWorkStep, type Step } from './steps'
import { discardSession, finishSession, saveProgress, startOrResume, type LevelUp } from './session'
import { RepsView, RestView, SetView, TimedView, WalkView, describeStep, sideKey } from './views'
import { StepList } from './StepList'
import styles from './Player.module.css'

type Phase = 'loading' | 'intro' | 'run' | 'summary'

export function PlayerPage() {
  const { templateId = '' } = useParams()
  const valid = templateId in templates
  return valid ? <Player templateId={templateId as TemplateId} /> : <Navigate to="/today" replace />
}

/** A strength set whose exercise is done one side at a time (not alternating). */
function isTwoSided(step: Step | undefined, levels: Levels): boolean {
  if (step?.type !== 'set') return false
  const id = resolveSlot(step.slot, levels)
  return targetFor(step.slot, id).perSide && !exerciseById[id].alternating
}

function Player({ templateId }: { templateId: TemplateId }) {
  const { t, l, lang } = useT()
  const navigate = useNavigate()
  const settings = useSettings()
  const levels = useLevels()
  const template = templates[templateId]

  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [cursor, setCursor] = useState(0)
  const [side, setSide] = useState<1 | 2>(1)
  const [listOpen, setListOpen] = useState(false)
  const [sets, setSets] = useState<LoggedSet[]>([])
  const [runStart, setRunStart] = useState<number | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [levelUps, setLevelUps] = useState<LevelUp[]>([])
  const [endedAt, setEndedAt] = useState(0)

  const setsPerExercise = settings ? setsFor(programPosition(settings.startDate, today())) : 2
  const steps = useMemo(() => buildSteps(templateId, setsPerExercise), [templateId, setsPerExercise])

  useEffect(() => {
    let cancelled = false
    void startOrResume(templateId).then((s) => {
      if (cancelled) return
      setSession(s)
      setSets(s.sets)
      setCursor(s.cursor ?? 0)
      const resumed = (s.cursor ?? 0) > 0 || s.sets.length > 0
      if (resumed) setRunStart(s.startedAt)
      setPhase(resumed ? 'run' : 'intro')
    })
    return () => {
      cancelled = true
    }
  }, [templateId])

  useWakeLock(phase === 'run')
  const elapsed = useElapsed(phase === 'run' ? runStart : null)

  const voiceOn = settings?.voice ?? true
  useEffect(() => configureVoice(voiceOn, lang), [voiceOn, lang])

  // Spoken cue for each new screen: the exercise (and side), or "Rest. Next: …"
  const step = steps[cursor] as Step | undefined
  const twoSided = levels ? isTwoSided(step, levels) : false
  const cueSide = twoSided ? side : step?.type === 'timed' || step?.type === 'reps' ? step.side : undefined
  const cue = useMemo(() => {
    if (phase !== 'run' || !step || !levels) return ''
    if (step.type === 'walk') return ''
    if (step.type === 'rest') {
      const next = nextWorkStep(steps, cursor)
      const rest = t('voice.rest', { n: step.seconds })
      return next ? `${rest}. ${t('voice.next', { name: describeStep(next, levels, t, l).title })}` : rest
    }
    const { title } = describeStep(step, levels, t, l)
    let amount = ''
    if (step.type === 'timed') amount = t('voice.seconds', { n: step.seconds })
    if (step.type === 'reps') amount = t('voice.reps', { n: step.reps })
    return [title, cueSide && t(sideKey(cueSide)), amount].filter(Boolean).join('. ')
  }, [phase, step, levels, steps, cursor, cueSide, t, l])
  useEffect(() => {
    if (cue) say(cue)
  }, [cue])

  if (phase === 'loading' || !session || !levels || !settings) return null

  const finish = async (walkMin?: number, finalSets = sets) => {
    const ups = await finishSession(session, finalSets, steps, levels, walkMin)
    say(t('voice.finished'))
    setLevelUps(ups)
    setEndedAt(Date.now())
    setPhase('summary')
  }

  const goTo = (index: number, newSets = sets, toSide: 1 | 2 = 1) => {
    setSets(newSets)
    setSide(toSide)
    setCursor(index)
    void saveProgress(session.id!, index, newSets)
  }

  /** Next screen: the second side of a two-sided set, the next step, or the summary after the last one. */
  const advance = (newSets = sets) => {
    if (twoSided && side === 1) {
      setSets(newSets)
      setSide(2)
      void saveProgress(session.id!, cursor, newSets)
      return
    }
    const next = cursor + 1
    if (next >= steps.length) {
      setSets(newSets)
      void saveProgress(session.id!, next, newSets).then(() => finish(undefined, newSets))
      return
    }
    goTo(next, newSets)
  }

  const back = () => {
    if (twoSided && side === 2) return setSide(1)
    const prev = prevWorkStep(steps, cursor)
    if (prev !== undefined) goTo(prev)
  }

  /** Logging a set again (after going back) replaces the earlier entry. */
  const logSet = (set: LoggedSet) => {
    const same = (x: LoggedSet) => x.slotId === set.slotId && x.setNo === set.setNo && x.side === set.side
    advance([...sets.filter((x) => !same(x)), set])
  }

  const readyFor = (index: number) => (steps[index - 1]?.type === 'rest' ? 0 : settings.readySec)

  if (phase === 'intro') {
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <Link to="/today" className={styles.iconButton} aria-label={t('common.back')}>
            <Icon name="chevronLeft" />
          </Link>
        </div>
        <div className={styles.header}>
          <div className="label">{l(template.description)}</div>
          <h1 className={styles.name}>{l(template.name)}</h1>
          <div className="muted">{t('today.minutes', { n: template.minutes })}</div>
          {template.kind === 'strength' && <div className="muted">{t('player.setsThisWeek', { n: setsPerExercise })}</div>}
        </div>
        <div className={styles.footer}>
          {settings.playlistUrl && (
            <a href={settings.playlistUrl} target="_blank" rel="noreferrer" className={buttonClass('secondary', true)}>
              <Icon name="music" size={18} /> {t('player.playlist')}
            </a>
          )}
          {settings.walkoutUrl && (
            <a href={settings.walkoutUrl} target="_blank" rel="noreferrer" className={buttonClass('secondary', true)}>
              <Icon name="play" size={16} /> {t('player.walkout')}
            </a>
          )}
          <Button
            block
            onClick={() => {
              unlockAudio()
              setRunStart(Date.now())
              setPhase('run')
            }}
          >
            <Icon name="play" size={18} /> {t('player.startWorkout')}
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'summary') {
    const totalReps = sets.reduce((sum, s) => sum + (s.reps ?? 0), 0)
    const duration = Math.round((endedAt - (runStart ?? session.startedAt)) / 1000)
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <div className="label">{l(template.name)}</div>
          <h1 className={styles.name}>{t('player.summary')}</h1>
        </div>
        <div className={styles.stats}>
          <div>
            <div className={styles.statValue}>{formatClock(duration)}</div>
            <div className="muted">{t('player.duration')}</div>
          </div>
          {sets.length > 0 && (
            <>
              <div>
                <div className={styles.statValue}>{sets.length}</div>
                <div className="muted">{t('player.setsLogged')}</div>
              </div>
              <div>
                <div className={styles.statValue}>{totalReps}</div>
                <div className="muted">{t('player.totalReps')}</div>
              </div>
            </>
          )}
        </div>
        {levelUps.length > 0 && (
          <div className={styles.upNext}>
            <div className="label">{t('player.levelUpTitle')}</div>
            {levelUps.map((u) => (
              <div key={u.chain} className={styles.upNextName}>
                {t('player.levelUp', { name: l(exerciseById[u.exerciseId].name) })}
              </div>
            ))}
          </div>
        )}
        <div className={styles.footer}>
          <Link to="/today" className={buttonClass('primary', true)}>
            {t('player.backToday')}
          </Link>
        </div>
      </div>
    )
  }

  if (!step) return null
  const next = nextWorkStep(steps, cursor)
  const viewKey = `${cursor}-${side}`

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconButton} onClick={() => setLeaving(true)} aria-label={t('player.close')}>
          <Icon name="close" size={20} />
        </button>
        <div className={styles.title}>{l(template.name)}</div>
        <div className={styles.topRight}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => void saveSetting('voice', !voiceOn)}
            aria-label={voiceOn ? t('player.voiceOff') : t('player.voiceOn')}
            aria-pressed={voiceOn}
          >
            <Icon name={voiceOn ? 'volume' : 'volumeOff'} size={20} />
          </button>
          <div className={styles.clock}>{formatClock(elapsed)}</div>
        </div>
      </div>
      <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={cursor}>
        <div className={styles.progressFill} style={{ width: `${(cursor / steps.length) * 100}%` }} />
      </div>

      {step.type === 'set' && (
        <SetView
          key={viewKey}
          step={step}
          side={twoSided ? side : undefined}
          levels={levels}
          sets={sets}
          next={next}
          readySec={settings.readySec}
          onLog={logSet}
        />
      )}
      {step.type === 'reps' && <RepsView key={viewKey} step={step} next={next} levels={levels} onDone={() => advance()} />}
      {step.type === 'timed' && (
        <TimedView key={viewKey} step={step} next={next} levels={levels} readySec={readyFor(cursor)} onDone={() => advance()} />
      )}
      {step.type === 'rest' && <RestView key={viewKey} step={step} next={next} levels={levels} onDone={() => advance()} />}
      {step.type === 'walk' && <WalkView key={viewKey} step={step} startedAt={runStart ?? Date.now()} onFinish={(m) => void finish(m)} />}

      {step.type !== 'walk' && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={back}
            disabled={prevWorkStep(steps, cursor) === undefined && !(twoSided && side === 2)}
          >
            <Icon name="chevronLeft" size={20} /> {t('player.back')}
          </button>
          <button type="button" className={`${styles.controlButton} ${styles.counterChip}`} onClick={() => setListOpen(true)}>
            <Icon name="list" size={20} /> {cursor + 1}/{steps.length}
          </button>
          <button type="button" className={styles.controlButton} onClick={() => advance()}>
            {t('player.skip')} <Icon name="chevronRight" size={20} />
          </button>
        </div>
      )}

      <StepList
        open={listOpen}
        onClose={() => setListOpen(false)}
        steps={steps}
        cursor={cursor}
        levels={levels}
        onJump={(i) => {
          setListOpen(false)
          goTo(i)
        }}
      />

      <Sheet open={leaving} onClose={() => setLeaving(false)} title={t('player.leaveTitle')}>
        <div className="muted">{t('player.leaveText')}</div>
        <Button block onClick={() => navigate('/today')}>
          {t('player.pauseLeave')}
        </Button>
        <Button
          variant="secondary"
          block
          onClick={() => {
            setLeaving(false)
            void finish()
          }}
        >
          {t('player.finishNow')}
        </Button>
        <Button
          variant="secondary"
          block
          onClick={async () => {
            await discardSession(session.id!)
            navigate('/today')
          }}
        >
          {t('player.discard')}
        </Button>
      </Sheet>
    </div>
  )
}
