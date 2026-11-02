import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useT } from '../i18n/I18nProvider'
import { useSettings } from '../db/settings'
import { updateDaily, useDaily } from '../db/queries'
import { today } from '../logic/dates'
import { reminderDue, standingMinutes } from '../logic/standing'
import { deskActions as act, remind, useDesk } from '../hooks/standingDesk'
import { useNow } from '../hooks/quickTimer'
import { Button } from './ui'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import styles from './StandingDesk.module.css'

/** Today's standing minutes, including the stand that's still going. */
export function useStandToday(): number {
  const { desk } = useDesk()
  const daily = useDaily(today())
  const now = useNow(desk.mode === 'standing')
  return (daily?.standMin ?? 0) + standingMinutes(desk, now)
}

/** Mounted once for the whole app: switch reminders, the floating pill and the sheet. */
export function StandingDesk() {
  const { t } = useT()
  const { desk, sheetOpen } = useDesk()
  const settings = useSettings()
  const { pathname } = useLocation()

  useEffect(() => {
    if (desk.mode === 'off' || desk.reminded || !settings?.deskReminders) return
    const check = () => {
      if (!reminderDue(desk, Date.now(), settings.standForMin, settings.sitForMin)) return
      if (desk.mode === 'standing') remind(t('desk.timeToSit'), t('desk.timeToSitText', { n: settings.standForMin }))
      else remind(t('desk.timeToStand'), t('desk.timeToStandText', { n: settings.sitForMin }))
    }
    check()
    const id = setInterval(check, 15_000)
    return () => clearInterval(id)
  }, [desk, settings, t])

  const showPill = desk.mode !== 'off' && !sheetOpen && !pathname.startsWith('/workout/')
  return (
    <>
      {showPill && <DeskPill />}
      <DeskSheet open={sheetOpen} />
    </>
  )
}

function DeskPill() {
  const { t } = useT()
  const { desk } = useDesk()
  const now = useNow(true)
  const min = Math.floor((now - desk.since) / 60_000)
  const standing = desk.mode === 'standing'
  return (
    <button type="button" data-floating className={`${styles.pill} ${standing ? styles.pillStanding : ''}`} onClick={act.open}>
      <Icon name={standing ? 'stand' : 'sit'} size={20} />
      <span>{t(standing ? 'desk.standingFor' : 'desk.sittingFor', { n: min })}</span>
    </button>
  )
}

function DeskSheet({ open }: { open: boolean }) {
  const { t } = useT()
  const { desk } = useDesk()
  const settings = useSettings()
  const daily = useDaily(today())
  const now = useNow(open)
  const total = useStandToday()
  if (!settings) return null

  const goal = settings.standGoalMin
  const min = Math.floor((now - desk.since) / 60_000)
  const nextIn =
    desk.mode === 'off' ? 0 : Math.max(0, (desk.mode === 'standing' ? settings.standForMin : settings.sitForMin) - min)
  const adjust = (delta: number) => void updateDaily(today(), { standMin: Math.max(0, (daily?.standMin ?? 0) + delta) })

  return (
    <Sheet open={open} title={t('desk.title')} onClose={act.close}>
      <div className={styles.total}>
        <span className={styles.big}>{total}</span>
        <span className="muted">
          / {goal} {t('unit.minutes')} {t('desk.standingToday')}
        </span>
      </div>
      <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={total}>
        <div className={styles.barFill} style={{ width: `${Math.min(1, total / goal) * 100}%` }} />
      </div>

      <div className={styles.status} aria-live="polite">
        {desk.mode === 'off' ? (
          <span className="muted">{t('desk.off')}</span>
        ) : (
          <>
            <Icon name={desk.mode === 'standing' ? 'stand' : 'sit'} />
            <span>{t(desk.mode === 'standing' ? 'desk.standingFor' : 'desk.sittingFor', { n: min })}</span>
            {settings.deskReminders && (
              <span className="muted">
                {' · '}
                {nextIn > 0
                  ? t(desk.mode === 'standing' ? 'desk.sitIn' : 'desk.standIn', { n: nextIn })
                  : t(desk.mode === 'standing' ? 'desk.timeToSit' : 'desk.timeToStand')}
              </span>
            )}
          </>
        )}
      </div>

      {desk.mode === 'off' ? (
        <div className={styles.row}>
          <Button className={styles.grow} onClick={act.stand}>
            <Icon name="stand" size={20} />
            {t('desk.startStanding')}
          </Button>
          <Button variant="secondary" className={styles.side} onClick={act.sit}>
            <Icon name="sit" size={20} />
            {t('desk.startSitting')}
          </Button>
        </div>
      ) : (
        <div className={styles.row}>
          <Button className={styles.grow} onClick={desk.mode === 'standing' ? act.sit : act.stand}>
            <Icon name={desk.mode === 'standing' ? 'sit' : 'stand'} size={20} />
            {t(desk.mode === 'standing' ? 'desk.sitDown' : 'desk.standUp')}
          </Button>
          <Button variant="secondary" className={styles.side} onClick={act.stop}>
            {t('desk.stop')}
          </Button>
        </div>
      )}

      <div className={styles.adjust}>
        <span className="muted">{t('desk.forgot')}</span>
        <div className={styles.adjustButtons}>
          <button type="button" className={styles.step} onClick={() => adjust(-15)} aria-label={t('desk.remove15')}>
            −15
          </button>
          <button type="button" className={styles.step} onClick={() => adjust(15)} aria-label={t('desk.add15')}>
            +15
          </button>
        </div>
      </div>

      <p className={`muted ${styles.tip}`}>{t('desk.tip', { stand: settings.standForMin, sit: settings.sitForMin })}</p>
    </Sheet>
  )
}
