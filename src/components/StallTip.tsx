import { useT } from '../i18n/I18nProvider'
import type { Session } from '../db/db'
import { exerciseHistory, stallOf } from '../logic/records'
import styles from './StallTip.module.css'

/** "Stuck for 3 sessions" with what to try. Renders nothing while the exercise is still improving. */
interface StallTipProps {
  exerciseId: string
  sessions: Session[]
  onLadder: boolean
  /** Shown before the title where the exercise isn't obvious from the screen. */
  name?: string
}

export function StallTip({ exerciseId, sessions, onLadder, name }: StallTipProps) {
  const { t } = useT()
  const stall = stallOf(exerciseHistory(sessions, exerciseId))
  if (!stall) return null
  const unit = t(stall.unit === 'seconds' ? 'unit.seconds' : 'unit.reps')
  return (
    <div className={styles.tip}>
      <div className={styles.title}>
        {name && `${name} · `}
        {t('stall.title', { n: stall.best, unit, s: stall.sessions })}
      </div>
      <div>{t(stall.unit === 'seconds' ? 'stall.time' : 'stall.reps')}</div>
      {onLadder && <div className="muted">{t('stall.reset')}</div>}
    </div>
  )
}
