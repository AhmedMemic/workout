import { useT, type Lang } from '../i18n/I18nProvider'
import styles from './LangToggle.module.css'

const langs: Lang[] = ['en', 'bs']

export function LangToggle() {
  const { lang, setLang, t } = useT()
  return (
    <div className={styles.toggle} role="group" aria-label={t('lang.label')}>
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? `${styles.option} ${styles.selected}` : styles.option}
          aria-pressed={l === lang}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
