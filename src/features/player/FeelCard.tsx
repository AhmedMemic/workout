import { useState } from 'react'
import { useT } from '../../i18n/I18nProvider'
import type { MessageKey } from '../../i18n/en'
import type { SessionRating } from '../../db/db'
import { rateSession } from './session'
import styles from './Player.module.css'

const ratings: SessionRating[] = [1, 2, 3, 4, 5]
export const feelKey = (r: SessionRating) => `feel.${r}` as MessageKey

/** Summary-screen rating (1–5) and note; each saves as soon as it changes. */
export function FeelCard({ sessionId }: { sessionId: number }) {
  const { t } = useT()
  const [rating, setRating] = useState<SessionRating>()

  return (
    <div className={styles.upNext}>
      <div className="label">{t('feel.title')}</div>
      <div className={styles.feelRow} role="radiogroup" aria-label={t('feel.title')}>
        {ratings.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={rating === r}
            className={`${styles.feelButton} ${rating === r ? styles.feelSelected : ''}`}
            onClick={() => {
              setRating(r)
              void rateSession(sessionId, { rating: r })
            }}
          >
            <span className={styles.feelNumber}>{r}</span>
            <span>{t(feelKey(r))}</span>
          </button>
        ))}
      </div>
      <label className={styles.noteField}>
        <span>{t('feel.note')}</span>
        <textarea
          rows={2}
          placeholder={t('feel.notePlaceholder')}
          onBlur={(e) => void rateSession(sessionId, { note: e.target.value.trim() || undefined })}
        />
      </label>
    </div>
  )
}
