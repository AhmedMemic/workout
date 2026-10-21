import type { ReactNode } from 'react'
import styles from './Page.module.css'

interface PageProps {
  title: string
  /** Small line above the title (e.g. the date). */
  eyebrow?: string
  /** Right side of the header (e.g. language toggle). */
  actions?: ReactNode
  children?: ReactNode
}

export function Page({ title, eyebrow, actions, children }: PageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titles}>
          {eyebrow && <div className="muted">{eyebrow}</div>}
          <h1 className={styles.title}>{title}</h1>
        </div>
        {actions}
      </header>
      {children}
    </div>
  )
}
