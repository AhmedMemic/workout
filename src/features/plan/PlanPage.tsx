import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Page } from '../../components/Page'
import { Icon } from '../../components/Icon'
import { Button, Card, Chips, ToggleChip, buttonClass } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { templates, type Template } from '../../data/templates'
import { exerciseById } from '../../data/exercises'
import { chains } from '../../data/chains'
import { db } from '../../db/db'
import { saveSetting, useSettings } from '../../db/settings'
import { removeManualSession, useDoneSessions, useLevels } from '../../db/queries'
import { MarkDoneSheet } from '../today/sheets'
import { StallTip } from '../../components/StallTip'
import { addDays, formatDay, startOfWeek, today as todayISO, weekday, weekdayName, type ISODate } from '../../logic/dates'
import { planFor, programPosition, resetWeekSwaps, setsFor, swapDays, weekHasSwaps, type PlanSwaps } from '../../logic/schedule'
import { levelOf, resolveSlot, slotForBlock, targetFor, type Levels } from '../../logic/progression'
import type { ChainId } from '../../data/types'
import styles from './Plan.module.css'

function Preview({ template, levels, sets, block }: { template: Template; levels: Levels; sets: number; block: number }) {
  const { t, l } = useT()
  if (template.kind === 'strength') {
    return (
      <ul className={styles.preview}>
        {template.pairs.flat().map((s) => {
          const slot = slotForBlock(s, block)
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
  const allDone = useDoneSessions()
  const date = todayISO()
  const [weekStart, setWeekStart] = useState(startOfWeek(date))
  const [open, setOpen] = useState<string | null>(date)
  const [marking, setMarking] = useState<ISODate | null>(null)
  // the swaps before the last change, offered back for a few seconds
  const [undo, setUndo] = useState<{ prev: PlanSwaps; text: string } | null>(null)
  useEffect(() => {
    if (!undo) return
    const id = setTimeout(() => setUndo(null), 8000)
    return () => clearTimeout(id)
  }, [undo])

  const weekEnd = addDays(weekStart, 6)
  const done = useLiveQuery(async () => {
    const rows = await db.sessions.where('date').between(weekStart, weekEnd, true, true).toArray()
    return rows.filter((s) => s.status === 'done')
  }, [weekStart, weekEnd])

  if (!settings || !levels || !done || !allDone) return null
  const pos = programPosition(settings.startDate, weekStart < settings.startDate ? settings.startDate : weekStart)
  const sets = setsFor(pos)
  const swaps = settings.planSwaps

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const plan = planFor(d, swaps)
    const isDone = done.some((s) => s.date === d && plan.options.includes(s.templateId))
    // past and finished days stay put, so history keeps matching what was done
    // walks and cardio done without the app can be ticked off afterwards; strength needs its sets
    const markable = !isDone && d <= date && d >= settings.startDate ? plan.options.filter((o) => templates[o].kind !== 'strength') : []
    const manual = done.filter((s) => s.date === d && s.manual)
    return { d, plan, main: plan.options[0], isDone, movable: d >= date && !isDone, markable, manual }
  })

  const change = (next: PlanSwaps, text: string) => {
    setUndo({ prev: swaps, text })
    void saveSetting('planSwaps', next)
  }
  const dayName = (d: ISODate) => weekdayName(weekday(d), lang)
  const swap = (a: ISODate, b: ISODate) => change(swapDays(swaps, a, b), t('plan.swapped', { a: dayName(a), b: dayName(b) }))

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

      <div aria-live="polite">
        {undo && (
          <div className={styles.undo}>
            <span>{undo.text}</span>
            <button
              type="button"
              className={styles.undoButton}
              onClick={() => {
                void saveSetting('planSwaps', undo.prev)
                setUndo(null)
              }}
            >
              {t('plan.undo')}
            </button>
          </div>
        )}
      </div>

      <div className={styles.days}>
        {days.map(({ d, plan, main, isDone, movable, markable, manual }) => {
          const missed = !isDone && plan.kind === 'strength' && d >= settings.startDate && d < date
          const status = isDone ? t('plan.done') : d === date ? t('plan.today') : missed ? t('plan.missed') : ''
          const expanded = open === d
          const targets = movable ? days.filter((o) => o.movable && o.d !== d) : []
          return (
            <div key={d} className={[styles.day, d === date && styles.isToday].filter(Boolean).join(' ')}>
              <button type="button" className={styles.dayHead} onClick={() => setOpen(expanded ? null : d)} aria-expanded={expanded}>
                <span className={styles.date}>{formatDay(d, lang)}</span>
                <span className={styles.dayName}>
                  {main ? l(templates[main].name) : t('plan.rest')}
                  {plan.options.length > 1 && <span className="muted"> +{plan.options.length - 1}</span>}
                  {d in swaps && <span className={styles.moved}>{t('plan.moved')}</span>}
                </span>
                <span className={isDone ? styles.statusDone : 'muted'}>
                  {isDone && <Icon name="check" size={14} strokeWidth={3} />} {status}
                </span>
              </button>
              {expanded && (main || targets.length > 0 || manual.length > 0) && (
                <div className={styles.dayBody}>
                  {main && <Preview template={templates[main]} levels={levels} sets={sets} block={pos.block} />}
                  {main && (
                    <Link to={`/workout/${main}`} className={buttonClass('secondary', true)}>
                      <Icon name="play" size={16} /> {t('today.start')} · {l(templates[main].name)}
                    </Link>
                  )}
                  {markable.length > 0 && (
                    <Button variant="secondary" block onClick={() => setMarking(d)}>
                      <Icon name="check" size={16} /> {t('sheet.markDone')}
                    </Button>
                  )}
                  {manual.map((s) => (
                    <Button key={s.id} variant="secondary" block onClick={() => void removeManualSession(s)}>
                      {t('done.remove', { name: `${l(templates[s.templateId].name)}${s.walkMin ? ` · ${s.walkMin} ${t('unit.minutes')}` : ''}` })}
                    </Button>
                  ))}
                  {targets.length > 0 && (
                    <div className={styles.swap}>
                      <div className="label">{t('plan.swapWith')}</div>
                      <Chips>
                        {targets.map((o) => (
                          <ToggleChip key={o.d} selected={false} onClick={() => swap(d, o.d)}>
                            {weekdayName(weekday(o.d), lang)} · {o.main ? l(templates[o.main].name) : t('plan.restShort')}
                          </ToggleChip>
                        ))}
                      </Chips>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {marking && (
        <MarkDoneSheet
          open
          onClose={() => setMarking(null)}
          date={marking}
          options={days.find((x) => x.d === marking)?.markable ?? []}
        />
      )}

      {weekHasSwaps(swaps, weekStart) && (
        <Button variant="secondary" block onClick={() => change(resetWeekSwaps(swaps, weekStart), t('plan.wasReset'))}>
          {t('plan.resetWeek')}
        </Button>
      )}

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
        {(Object.keys(chains) as ChainId[]).map((c) => {
          const id = chains[c].steps[levelOf(c, levels)]
          return <StallTip key={c} exerciseId={id} sessions={allDone} onLadder name={l(exerciseById[id].name)} />
        })}
      </Card>
    </Page>
  )
}
