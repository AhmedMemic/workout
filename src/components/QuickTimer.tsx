import { useLocation } from 'react-router-dom'
import { useT } from '../i18n/I18nProvider'
import { displaySec, formatTimer, isActive, isRunning } from '../logic/timer'
import { timerActions as act, useNow, useQuickTimer } from '../hooks/quickTimer'
import { useWakeLock } from '../hooks/device'
import { Button, ToggleChip } from './ui'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import styles from './QuickTimer.module.css'

const PRESETS = [30, 60, 120, 180, 300, 600, 900, 1200, 1800]

/** Header button that opens the timer. */
export function TimerButton() {
  const { t } = useT()
  return (
    <button type="button" className={styles.headerButton} onClick={act.open} aria-label={t('timer.open')}>
      <Icon name="clock" />
    </button>
  )
}

/**
 * Mounted once for the whole app: the sheet, the floating pill while a timer is going,
 * and the wake lock so the phone doesn't sleep before the alarm.
 */
export function QuickTimer() {
  const { timer, sheetOpen } = useQuickTimer()
  const { pathname } = useLocation()
  useWakeLock(isRunning(timer) || timer.ringing)
  // the player has its own controls at the bottom; the alarm still opens the sheet there
  const showPill = isActive(timer) && !sheetOpen && !pathname.startsWith('/workout/')
  return (
    <>
      {showPill && <TimerPill />}
      <TimerSheet open={sheetOpen} />
    </>
  )
}

function TimerPill() {
  const { t } = useT()
  const { timer } = useQuickTimer()
  const now = useNow(isRunning(timer))
  const cls = [styles.pill, timer.ringing && styles.pillRinging, !isRunning(timer) && !timer.ringing && styles.pillPaused]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" data-floating className={cls} onClick={act.open} aria-label={t('timer.open')}>
      <Icon name="clock" size={20} />
      <span className={styles.pillTime}>{timer.ringing ? t('timer.timesUp') : formatTimer(displaySec(timer, now))}</span>
    </button>
  )
}

function TimerSheet({ open }: { open: boolean }) {
  const { t } = useT()
  const { timer } = useQuickTimer()
  const running = isRunning(timer)
  const active = isActive(timer)
  const countdown = timer.mode === 'countdown'
  const now = useNow(open && running)
  const shown = formatTimer(displaySec(timer, now))

  const status = timer.ringing ? t('timer.timesUp') : active && !running ? t('timer.paused') : ' '

  return (
    <Sheet open={open} title={t('timer.title')} onClose={act.close}>
      <div className={styles.modes} role="group">
        {(['countdown', 'stopwatch'] as const).map((m) => (
          <ToggleChip
            key={m}
            selected={timer.mode === m}
            disabled={active && timer.mode !== m}
            onClick={() => act.setMode(m)}
            className={styles.mode}
          >
            {t(`timer.${m}`)}
          </ToggleChip>
        ))}
      </div>

      <div className={styles.face}>
        {countdown && !active && (
          <button type="button" className={styles.step} onClick={() => act.addTime(-60)} aria-label={t('timer.removeMin')}>
            <Icon name="minus" />
          </button>
        )}
        <div
          className={`${styles.time} ${running || timer.ringing ? styles.accent : ''} ${timer.ringing ? styles.ringing : ''}`}
          role="timer"
          aria-live="off"
        >
          {shown}
        </div>
        {countdown && !active && (
          <button type="button" className={styles.step} onClick={() => act.addTime(60)} aria-label={t('timer.addMin')}>
            <Icon name="plus" />
          </button>
        )}
      </div>
      <div className={`${styles.status} ${timer.ringing ? styles.accent : 'muted'}`} aria-live="polite">
        {status}
      </div>

      {timer.ringing ? (
        <div className={styles.row}>
          <Button className={styles.grow} onClick={act.reset}>
            {t('timer.stop')}
          </Button>
          <Button variant="secondary" className={styles.side} onClick={() => act.addTime(60)}>
            {t('timer.plusMin')}
          </Button>
        </div>
      ) : (
        <div className={styles.row}>
          <Button className={styles.grow} onClick={running ? act.pause : act.start}>
            <Icon name={running ? 'pause' : 'play'} size={20} />
            {running ? t('timer.pause') : active ? t('timer.resume') : t('timer.start')}
          </Button>
          {active && (
            <Button variant="secondary" className={styles.side} onClick={act.reset}>
              {t('timer.reset')}
            </Button>
          )}
          {active && countdown && (
            <Button variant="secondary" className={styles.side} onClick={() => act.addTime(60)}>
              {t('timer.plusMin')}
            </Button>
          )}
        </div>
      )}

      {countdown && !active && (
        <>
          <div className="muted">{t('timer.quick')}</div>
          <div className={styles.presets}>
            {PRESETS.map((sec) => (
              <button key={sec} type="button" className={styles.preset} onClick={() => act.startWith(sec)}>
                {sec < 60 ? `${sec} ${t('unit.seconds')}` : `${sec / 60} ${t('unit.minutes')}`}
              </button>
            ))}
          </div>
        </>
      )}

      <p className={`muted ${styles.note}`}>{t('timer.screenOn')}</p>
    </Sheet>
  )
}
