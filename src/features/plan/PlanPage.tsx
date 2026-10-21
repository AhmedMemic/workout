import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Page } from '../../components/Page'
import { Icon } from '../../components/Icon'
import { Card, buttonClass } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { templates, type Template } from '../../data/templates'
import { exerciseById } from '../../data/exercises'
import { chains } from '../../data/chains'
import { db } from '../../db/db'
import { useSettings } from '../../db/settings'
import { useLevels } from '../../db/queries'
import { addDays, formatDay, startOfWeek, today as todayISO } from '../../logic/dates'
import { planFor, programPosition, setsFor } from '../../logic/schedule'
import { levelOf, resolveSlot, targetFor, type Levels } from '../../logic/progression'
import type { ChainId } from '../../data/types'
import styles from './Plan.module.css'

function Preview({ template, levels, sets }: { template: Template; levels: Levels; sets: number }) {
  const { t, l } = useT()
  if (template.kind === 'strength') {
    return (
      <ul className={styles.preview}>
        {template.pairs.flat().map((slot) => {
          const id = resolveSlot(slot, levels)
          const target = targetFor(slot, id)
          return (
            <li key={slot.id}>
              <span className={styles.slot}>{slot.id.slice(1)}</span>
              <span className={styles.previewName}>{l(exerciseById[id].name)}</span>
              <span className="muted">
                {sets} × {target.min}–{target.max}
                {target.measure === 'time' ? ' s' : ''}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }
  if (template.kind === 'flow' || template.kind === 'complex') {
    return (
      <ul className={styles.preview}>
        {template.items.map((item, i) => (
          <li key={i}>
            <span className={styles.previewName}>{l(exerciseById[item.exerciseId].name)}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (template.kind === 'rounds') {
    return (
      <div className="muted">
        {template.rounds} × {template.exerciseIds.map((id) => l(exerciseById[id].name)).join(', ')}
      </div>
    )
  }
  return <div className="muted">{t('today.minutes', { n: template.minutes })}</div>
}

export function PlanPage() {
  const { t, l, lang } = useT()
  const settings = useSettings()
  const levels = useLevels()
  const date = todayISO()
  const [weekStart, setWeekStart] = useState(startOfWeek(date))
  const [open, setOpen] = useState<string | null>(date)

  const weekEnd = addDays(weekStart, 6)
  const done = useLiveQuery(async () => {
    const rows = await db.sessions.where('date').between(weekStart, weekEnd, true, true).toArray()
    return rows.filter((s) => s.status === 'done')
  }, [weekStart, weekEnd])

  if (!settings || !levels || !done) return null
  const pos = programPosition(settings.startDate, weekStart < settings.startDate ? settings.startDate : weekStart)
  const sets = setsFor(pos)

  return (
    <Page
      title={t('plan.title')}
      eyebrow={`${t('today.block', { b: pos.block, w: pos.week })}${pos.deload ? ` · ${t('today.deload')}` : ''}`}
    >
      <div className={styles.weekNav}>
        <button type="button" className={styles.navButton} onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label={t('plan.prevWeek')}>
          <Icon name="chevronLeft" />
        </button>
        <div className={styles.weekLabel}>
          {weekStart === startOfWeek(date) ? t('plan.thisWeek') : `${formatDay(weekStart, lang)} – ${formatDay(weekEnd, lang)}`}
        </div>
        <button type="button" className={styles.navButton} onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label={t('plan.nextWeek')}>
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className={styles.days}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(weekStart, i)
          const plan = planFor(d)
          const main = plan.options[0]
          const isDone = done.some((s) => s.date === d && plan.options.includes(s.templateId))
          const missed = !isDone && plan.kind === 'strength' && d >= settings.startDate && d < date
          const status = isDone ? t('plan.done') : d === date ? t('plan.today') : missed ? t('plan.missed') : ''
          const expanded = open === d
          return (
            <div key={d} className={[styles.day, d === date && styles.isToday].filter(Boolean).join(' ')}>
              <button type="button" className={styles.dayHead} onClick={() => setOpen(expanded ? null : d)} aria-expanded={expanded}>
                <span className={styles.date}>{formatDay(d, lang)}</span>
                <span className={styles.dayName}>
                  {main ? l(templates[main].name) : t('plan.rest')}
                  {plan.options.length > 1 && <span className="muted"> +{plan.options.length - 1}</span>}
                </span>
                <span className={isDone ? styles.statusDone : 'muted'}>
                  {isDone && <Icon name="check" size={14} strokeWidth={3} />} {status}
                </span>
              </button>
              {expanded && main && (
                <div className={styles.dayBody}>
                  <Preview template={templates[main]} levels={levels} sets={sets} />
                  <Link to={`/workout/${main}`} className={buttonClass('secondary', true)}>
                    <Icon name="play" size={16} /> {t('today.start')} · {l(templates[main].name)}
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="muted">{t('plan.daily')}</p>

      <Card>
        <div className="label">{t('plan.levels')}</div>
        <ul className={styles.preview}>
          {(Object.keys(chains) as ChainId[]).map((c) => (
            <li key={c}>
              <span className={styles.previewName}>{l(chains[c].name)}</span>
              <Link to={`/exercises/${chains[c].steps[levelOf(c, levels)]}`}>
                {levelOf(c, levels) + 1}/{chains[c].steps.length} · {l(exerciseById[chains[c].steps[levelOf(c, levels)]].name)}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  )
}
