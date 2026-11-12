import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/Page'
import { Icon } from '../../components/Icon'
import { ExerciseFigure } from '../../components/ExerciseFigure'
import { Card, Chip, Chips } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { exerciseById, youtubeUrl } from '../../data/exercises'
import { findInChains } from '../../data/chains'
import { equipmentLabels, muscleLabels } from '../../data/labels'
import { useDoneSessions, useLevels } from '../../db/queries'
import { formatShort } from '../../logic/dates'
import { levelOf } from '../../logic/progression'
import { bestPerSession, exerciseHistory, firstDone } from '../../logic/records'
import { TrendChart } from '../../components/charts'
import styles from './Exercises.module.css'

export function ExerciseDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { t, l, lang } = useT()
  const exercise = exerciseById[id]
  if (!exercise) return <Navigate to="/exercises" replace />

  const otherLang = lang === 'en' ? 'bs' : 'en'
  const ladder = findInChains(exercise.id)
  const sessions = useDoneSessions()
  const levels = useLevels()
  const history = sessions && exerciseHistory(sessions, exercise.id)
  const yourStep = ladder && levels ? levelOf(ladder.chain.id, levels) : undefined
  const reached = ladder && sessions ? firstDone(sessions) : undefined
  const unit = history && t(history.unit === 'seconds' ? 'unit.seconds' : 'unit.reps')

  return (
    <Page
      title={l(exercise.name)}
      eyebrow={exercise.name[otherLang]}
      actions={
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label={t('common.back')}>
          <Icon name="chevronLeft" />
        </button>
      }
    >
      <ExerciseFigure exerciseId={exercise.id} />
      <Chips>
        {exercise.perSide && <Chip>{t('exercise.perSide')}</Chip>}
        {exercise.measure === 'time' && <Chip>{t('exercise.timed')}</Chip>}
        {exercise.equipment.map((eq) => (
          <Chip key={eq}>{l(equipmentLabels[eq])}</Chip>
        ))}
      </Chips>

      {history && (
        <Card>
          <div className="label">{t('exercise.history')}</div>
          <div className={styles.best}>
            <span className={styles.bestValue}>
              {history.best.value} {unit}
            </span>
            <span className="muted">{t('exercise.best', { date: formatShort(history.best.date, lang) })}</span>
          </div>
          {history.days.length > 1 && (
            <>
              <TrendChart points={[]} trend={bestPerSession(history)} unit={unit!} lang={lang} label={t('exercise.chart')} />
              <div className="muted">{t('exercise.chartLegend')}</div>
            </>
          )}
          <ul className={styles.historyList}>
            {history.days.slice(0, 8).map((d) => (
              <li key={d.date} className={d.note ? styles.withNote : undefined}>
                <div className={styles.historyTop}>
                  <span className="muted">{formatShort(d.date, lang)}</span>
                  <span>{d.values.join(' · ')}</span>
                </div>
                {d.note && <div className={styles.note}>“{d.note}”</div>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="label">{t('exercise.steps')}</div>
        <ol className={styles.steps}>
          {exercise.steps[lang].map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <a href={youtubeUrl(exercise)} target="_blank" rel="noreferrer" className={styles.youtube}>
          {t('exercise.youtube')} <Icon name="external" size={16} />
        </a>
      </Card>

      <Card>
        <div className="label">{t('exercise.muscles')}</div>
        <div>{exercise.muscles.map((m) => l(muscleLabels[m])).join(' · ')}</div>
      </Card>

      {ladder && (
        <Card>
          <div className="label">{t('exercise.ladder', { chain: l(ladder.chain.name) })}</div>
          <ol className={styles.ladder}>
            {ladder.chain.steps.map((stepId, i) => (
              <li key={stepId}>
                <Link
                  to={`/exercises/${stepId}`}
                  replace
                  className={stepId === exercise.id ? `${styles.ladderStep} ${styles.ladderCurrent}` : styles.ladderStep}
                  aria-current={stepId === exercise.id ? 'step' : undefined}
                >
                  <span className={styles.ladderNum}>{i + 1}</span>
                  <span className={styles.ladderName}>{l(exerciseById[stepId].name)}</span>
                  {i === yourStep && <span className={styles.yourLevel}>{t('exercise.yourLevel')}</span>}
                  {reached?.get(stepId) && i !== yourStep && (
                    <span className="muted">{formatShort(reached.get(stepId)!, lang)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
          {ladder.chain.steps.some((id) => reached?.has(id)) && <div className="muted">{t('exercise.ladderDates')}</div>}
        </Card>
      )}
    </Page>
  )
}
