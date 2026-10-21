import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, buttonClass } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Sheet } from '../../components/Sheet'
import { useT } from '../../i18n/I18nProvider'
import { templates, type TemplateId } from '../../data/templates'
import { exerciseById } from '../../data/exercises'
import type { LoggedSet, Session } from '../../db/db'
import { useSettings } from '../../db/settings'
import { useLevels } from '../../db/queries'
import { today } from '../../logic/dates'
import { programPosition, setsFor } from '../../logic/schedule'
import { formatClock, useElapsed } from '../../hooks/useCountdown'
import { unlockAudio, useWakeLock } from '../../hooks/device'
import { buildSteps, nextWorkStep } from './steps'
import { discardSession, finishSession, saveProgress, startOrResume, type LevelUp } from './session'
import { RepsView, RestView, SetView, TimedView, WalkView } from './views'
import styles from './Player.module.css'

type Phase = 'loading' | 'intro' | 'run' | 'summary'

export function PlayerPage() {
  const { templateId = '' } = useParams()
  const valid = templateId in templates
  return valid ? <Player templateId={templateId as TemplateId} /> : <Navigate to="/today" replace />
}

function Player({ templateId }: { templateId: TemplateId }) {
  const { t, l } = useT()
  const navigate = useNavigate()
  const settings = useSettings()
  const levels = useLevels()
  const template = templates[templateId]

  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [cursor, setCursor] = useState(0)
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

  if (phase === 'loading' || !session || !levels || !settings) return null

  const finish = async (walkMin?: number) => {
    const ups = await finishSession(session, sets, steps, levels, walkMin)
    setLevelUps(ups)
    setEndedAt(Date.now())
    setPhase('summary')
  }

  const advance = (newSets = sets) => {
    const next = cursor + 1
    setSets(newSets)
    if (next >= steps.length) {
      void saveProgress(session.id!, next, newSets).then(() => finish())
      return
    }
    setCursor(next)
    void saveProgress(session.id!, next, newSets)
  }

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

  const step = steps[cursor]
  const next = nextWorkStep(steps, cursor)

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconButton} onClick={() => setLeaving(true)} aria-label={t('player.close')}>
          <Icon name="close" size={20} />
        </button>
        <div className={styles.title}>{l(template.name)}</div>
        <div className={styles.clock}>{formatClock(elapsed)}</div>
      </div>
      <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={cursor}>
        <div className={styles.progressFill} style={{ width: `${(cursor / steps.length) * 100}%` }} />
      </div>

      {step.type === 'set' && (
        <SetView key={cursor} step={step} levels={levels} sets={sets} next={next} onLog={(s) => advance([...sets, s])} />
      )}
      {step.type === 'reps' && <RepsView key={cursor} step={step} next={next} levels={levels} onDone={() => advance()} />}
      {step.type === 'timed' && <TimedView key={cursor} step={step} next={next} levels={levels} onDone={() => advance()} />}
      {step.type === 'rest' && <RestView key={cursor} step={step} next={next} levels={levels} onDone={() => advance()} />}
      {step.type === 'walk' && <WalkView key={cursor} step={step} startedAt={runStart ?? Date.now()} onFinish={(m) => void finish(m)} />}

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
