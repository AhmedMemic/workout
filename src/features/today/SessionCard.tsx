import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Chips, ToggleChip, buttonClass } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n/I18nProvider'
import { templates, type TemplateId } from '../../data/templates'
import { templateSize } from '../../data/templateInfo'
import { OverviewSheet } from './OverviewSheet'
import { MarkDoneSheet } from './sheets'
import { removeManualSession, useManualSessions } from '../../db/queries'
import { today } from '../../logic/dates'
import styles from './Today.module.css'

interface SessionCardProps {
  options: TemplateId[]
  makeUp?: TemplateId
  done: TemplateId[]
}

export function SessionCard({ options, makeUp, done }: SessionCardProps) {
  const { t, l } = useT()
  const [picked, setPicked] = useState<TemplateId | null>(null)
  const [overview, setOverview] = useState(false)
  const [marking, setMarking] = useState(false)
  const date = today()
  const manual = useManualSessions(date, date)

  if (options.length === 0) {
    return (
      <Card>
        <div className="label">{t('today.tonight')}</div>
        <h2 className={styles.sessionName}>{t('today.restDay')}</h2>
        <div className="muted">{t('today.restText')}</div>
      </Card>
    )
  }

  const id = picked && options.includes(picked) ? picked : options[0]
  const template = templates[id]
  const size = templateSize(template)
  const isDone = done.includes(id)
  const manualDone = manual?.find((s) => s.templateId === id)
  // strength sessions need their sets for progression, so only walks and cardio can be ticked off
  const markable = options.filter((o) => templates[o].kind !== 'strength' && !done.includes(o))

  const meta = [
    l(template.description),
    size && t(size.unit === 'rounds' ? 'today.rounds' : 'today.items', { n: size.n }),
    t('today.minutes', { n: template.minutes }),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card>
      <div className="label">{id === makeUp ? t('today.makeUp') : t('today.tonight')}</div>
      <h2 className={styles.sessionName}>{l(template.name)}</h2>
      {isDone && (
        <div className={styles.doneBadge}>
          <Icon name="check" size={18} strokeWidth={3} /> {t('today.doneToday')}
        </div>
      )}
      <div className="muted">{meta}</div>
      {options.length > 1 && (
        <Chips>
          {options.map((o) => (
            <ToggleChip key={o} selected={o === id} onClick={() => setPicked(o)}>
              {l(templates[o].name)}
            </ToggleChip>
          ))}
        </Chips>
      )}
      <div className={styles.sessionButtons}>
        <button type="button" className={buttonClass('secondary')} onClick={() => setOverview(true)}>
          <Icon name="list" size={18} /> {t('today.overview')}
        </button>
        <Link to={`/workout/${id}`} className={buttonClass(isDone ? 'secondary' : 'primary', true)}>
          <Icon name="play" size={18} />
          {isDone ? t('today.again') : t('today.start')}
        </Link>
      </div>
      {template.kind === 'strength' && !isDone && (
        <Link to={`/workout/${id}?short=1`} className={buttonClass('secondary', true)}>
          <Icon name="clock" size={18} /> {t('today.short')}
        </Link>
      )}
      {template.kind !== 'strength' && !isDone && (
        <button type="button" className={buttonClass('secondary', true)} onClick={() => setMarking(true)}>
          <Icon name="check" size={18} /> {t('sheet.markDone')}
        </button>
      )}
      {manualDone && (
        <button type="button" className={buttonClass('secondary', true)} onClick={() => void removeManualSession(manualDone)}>
          {t('sheet.markUndone')}
        </button>
      )}
      <MarkDoneSheet
        open={marking}
        onClose={() => setMarking(false)}
        date={date}
        options={[id, ...markable.filter((o) => o !== id)]}
      />
      <OverviewSheet templateId={id} open={overview} onClose={() => setOverview(false)} />
    </Card>
  )
}
