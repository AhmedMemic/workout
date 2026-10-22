import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Chips, ToggleChip, buttonClass } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n/I18nProvider'
import { templates, type TemplateId } from '../../data/templates'
import { templateSize } from '../../data/templateInfo'
import styles from './Today.module.css'

interface SessionCardProps {
  options: TemplateId[]
  makeUp?: TemplateId
  done: TemplateId[]
}

export function SessionCard({ options, makeUp, done }: SessionCardProps) {
  const { t, l } = useT()
  const [picked, setPicked] = useState<TemplateId | null>(null)

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
      <Link to={`/workout/${id}`} className={buttonClass(isDone ? 'secondary' : 'primary', true)}>
        <Icon name="play" size={18} />
        {isDone ? t('today.again') : t('today.start')}
      </Link>
    </Card>
  )
}
