import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import styles from './ui.module.css'

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(styles.card, className)} {...rest} />
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className={styles.chip}>{children}</span>
}

interface ToggleChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean
}

export function ToggleChip({ selected, className, ...rest }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(styles.chip, selected && styles.chipSelected, className)}
      {...rest}
    />
  )
}

export function Chips({ children }: { children: ReactNode }) {
  return <div className={styles.chips}>{children}</div>
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  block?: boolean
}

export function Button({ variant = 'primary', block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cx(styles.button, styles[variant], block && styles.block, className)} {...rest} />
}

/** Class names for links that look like buttons. */
export const buttonClass = (variant: 'primary' | 'secondary' = 'primary', block = false) =>
  cx(styles.button, styles[variant], block && styles.block)
