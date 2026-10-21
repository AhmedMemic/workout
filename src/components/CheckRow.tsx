import { Icon } from './Icon'
import styles from './CheckRow.module.css'

export type CheckState = 'done' | 'partial' | 'empty'

interface CheckRowProps {
  state: CheckState
  label: string
  value?: string
  onClick: () => void
}

export function CheckRow({ state, label, value, onClick }: CheckRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <span className={`${styles.mark} ${styles[state]}`}>
        {state === 'done' && <Icon name="check" size={16} strokeWidth={3} />}
      </span>
      <span className={styles.label}>{label}</span>
      {value && <span className={styles.value}>{value}</span>}
    </button>
  )
}
