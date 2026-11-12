import { Card } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { TestResult } from '../../db/db'
import { formatShort } from '../../logic/dates'
import { BALANCE_MAX, OFF_WALL_SEC, balanceStatus } from '../../logic/balance'
import styles from './Progress.module.css'

function SideBar({ label, value }: { label: string; value?: number }) {
  const share = value === undefined ? 0 : Math.min(value, BALANCE_MAX) / BALANCE_MAX
  return (
    <div className={styles.sideRow}>
      <span className={styles.sideLabel}>{label}</span>
      <div className={styles.sideTrack}>
        <div className={styles.sideFill} style={{ width: `${share * 100}%` }} />
        {/* the off-the-wall mark */}
        <div className={styles.sideMark} style={{ left: `${(OFF_WALL_SEC / BALANCE_MAX) * 100}%` }} />
      </div>
      <span className={styles.sideValue}>{value ?? '–'}</span>
    </div>
  )
}

/** Left vs right one-leg stand from the re-tests, and whether it's time to leave the wall. */
export function BalanceCard({ tests }: { tests: TestResult[] }) {
  const { t, lang } = useT()
  const b = balanceStatus(tests)
  const both = b.latest?.left !== undefined && b.latest?.right !== undefined

  return (
    <Card>
      <div className="label">{t('balance.title')}</div>
      {!b.latest ? (
        <div className="muted">{t('balance.none')}</div>
      ) : (
        <>
          {b.rows
            .slice(-4)
            .reverse()
            .map((r) => (
              <div key={r.date} className={styles.sideTest}>
                <div className="muted">{formatShort(r.date, lang)}</div>
                <SideBar label={t('balance.left')} value={r.left} />
                <SideBar label={t('balance.right')} value={r.right} />
              </div>
            ))}
          <div className="muted">{t('balance.legend', { n: OFF_WALL_SEC, max: BALANCE_MAX })}</div>
          {both && (
            <div>
              {b.weaker
                ? t('balance.weaker', { side: t(b.weaker === 'left' ? 'balance.sideLeft' : 'balance.sideRight'), n: b.gap })
                : t('balance.even')}
            </div>
          )}
          {both && <div className={b.readyOffWall ? styles.better : undefined}>{b.readyOffWall ? t('balance.offWall', { n: OFF_WALL_SEC }) : t('balance.keepWall', { n: OFF_WALL_SEC })}</div>}
        </>
      )}
    </Card>
  )
}
