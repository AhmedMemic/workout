import { Sheet } from '../../components/Sheet'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n/I18nProvider'
import type { MessageKey } from '../../i18n/en'
import type { Levels } from '../../logic/progression'
import type { Step } from './steps'
import { describeStep } from './views'
import styles from './Player.module.css'

interface StepListProps {
  open: boolean
  onClose: () => void
  steps: Step[]
  cursor: number
  levels: Levels
  onJump: (index: number) => void
}

/** Every exercise in the session, current one marked; tap one to jump there. */
export function StepList({ open, onClose, steps, cursor, levels, onJump }: StepListProps) {
  const { t, l } = useT()
  return (
    <Sheet open={open} onClose={onClose} title={t('player.allExercises')}>
      <ol className={styles.stepList}>
        {steps.map((step, i) => {
          if (step.type === 'rest') return null
          const prev = steps.slice(0, i).findLast((s) => s.type !== 'rest')
          const header = !prev || prev.section !== step.section
          const { title, meta } = describeStep(step, levels, t, l)
          const state = i === cursor ? styles.stepCurrent : i < cursor ? styles.stepDone : ''
          return (
            <li key={i}>
              {header && <div className={`label ${styles.stepSection}`}>{t(`player.section.${step.section}` as MessageKey)}</div>}
              <button
                type="button"
                className={`${styles.stepRow} ${state}`}
                aria-current={i === cursor ? 'step' : undefined}
                onClick={() => onJump(i)}
              >
                <span className={styles.stepMark}>{i < cursor ? <Icon name="check" size={16} strokeWidth={3} /> : null}</span>
                <span className={styles.stepText}>
                  <span className={styles.stepTitle}>{title}</span>
                  <span className="muted">{meta}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Sheet>
  )
}
