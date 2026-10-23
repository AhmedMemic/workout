import { Link } from 'react-router-dom'
import { Sheet } from '../../components/Sheet'
import { Icon } from '../../components/Icon'
import { ExerciseThumb } from '../../components/ExerciseFigure'
import { buttonClass } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { MessageKey } from '../../i18n/en'
import { templates, type TemplateId } from '../../data/templates'
import { exerciseById } from '../../data/exercises'
import { useSettings } from '../../db/settings'
import { useLevels } from '../../db/queries'
import { today } from '../../logic/dates'
import { programPosition, setsFor } from '../../logic/schedule'
import { resolveSlot, targetFor, type Levels } from '../../logic/progression'
import { formatClock } from '../../hooks/useCountdown'
import { buildSteps, overviewSteps, type Step } from '../player/steps'
import styles from './Today.module.css'

type T = ReturnType<typeof useT>['t']

function exerciseOf(step: Step, levels: Levels): string {
  if (step.type === 'set') return resolveSlot(step.slot, levels)
  if (step.type === 'walk') return 'brisk-walk'
  if (step.type === 'rest') return ''
  return step.exerciseId
}

/** Target for the whole session, e.g. "2 × 6–15 reps", "30 s per side", "3 rounds · 2:00". */
function targetLine(step: Step, levels: Levels, t: T): string {
  const perSide = ` ${t('player.perSide')}`
  switch (step.type) {
    case 'set': {
      const target = targetFor(step.slot, resolveSlot(step.slot, levels))
      const unit = t(target.measure === 'time' ? 'unit.seconds' : 'unit.reps')
      return `${step.totalSets} × ${target.min}–${target.max} ${unit}${target.perSide ? perSide : ''}`
    }
    case 'reps':
    case 'timed': {
      const amount =
        step.type === 'reps'
          ? `${step.reps} ${t('unit.reps')}`
          : step.seconds >= 60
            ? formatClock(step.seconds)
            : `${step.seconds} ${t('unit.seconds')}`
      const sided = step.side || (step.type === 'reps' && step.perSide) ? perSide : ''
      return [step.totalRounds && t('today.rounds', { n: step.totalRounds }), amount + sided].filter(Boolean).join(' · ')
    }
    case 'walk':
      return `${step.minutes} ${t('unit.minutes')}`
    case 'rest':
      return ''
  }
}

/** Every exercise in a session at your current levels and this week's set count. */
export function OverviewSheet({ templateId, open, onClose }: { templateId: TemplateId; open: boolean; onClose: () => void }) {
  const { t, l } = useT()
  const settings = useSettings()
  const levels = useLevels()
  if (!settings || !levels) return null

  const steps = overviewSteps(buildSteps(templateId, setsFor(programPosition(settings.startDate, today()))))
  const sections = [...new Set(steps.map((s) => s.section))]

  return (
    <Sheet open={open} onClose={onClose} title={l(templates[templateId].name)}>
      {sections.map((section) => (
        <section key={section} className={styles.overviewSection}>
          {sections.length > 1 && <div className="label">{t(`player.section.${section}` as MessageKey)}</div>}
          <ul className={styles.overviewList}>
            {steps
              .filter((s) => s.section === section)
              .map((step) => {
                const id = exerciseOf(step, levels)
                return (
                  <li key={step.type === 'set' ? step.slot.id : id}>
                    <Link to={`/exercises/${id}`} className={styles.overviewRow}>
                      <ExerciseThumb exerciseId={id} />
                      <span className={styles.overviewText}>
                        <span className={styles.overviewName}>{l(exerciseById[id].name)}</span>
                        <span className="muted">{targetLine(step, levels, t)}</span>
                      </span>
                      <Icon name="chevronRight" size={20} className="muted" />
                    </Link>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
      <Link to={`/workout/${templateId}`} className={buttonClass('primary', true)}>
        <Icon name="play" size={18} /> {t('today.start')}
      </Link>
    </Sheet>
  )
}
