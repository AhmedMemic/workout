import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import { useT } from '../i18n/I18nProvider'
import styles from './Sheet.module.css'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Bottom sheet on phones, centred dialog on wide screens. Built on <dialog> for focus + Esc. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useT()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // backdrop click
      }}
    >
      {open && (
        <div className={styles.body}>
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label={t('common.close')}>
              <Icon name="close" size={20} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
