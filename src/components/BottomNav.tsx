import { NavLink } from 'react-router-dom'
import { useT } from '../i18n/I18nProvider'
import type { MessageKey } from '../i18n/en'
import { Icon, type IconName } from './Icon'
import styles from './BottomNav.module.css'

const items: { to: string; icon: IconName; label: MessageKey }[] = [
  { to: '/today', icon: 'today', label: 'nav.today' },
  { to: '/plan', icon: 'plan', label: 'nav.plan' },
  { to: '/exercises', icon: 'exercises', label: 'nav.exercises' },
  { to: '/progress', icon: 'progress', label: 'nav.progress' },
  { to: '/me', icon: 'me', label: 'nav.me' },
]

export function BottomNav() {
  const { t } = useT()
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>Corner</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
        >
          <Icon name={item.icon} />
          <span>{t(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
