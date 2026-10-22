import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/Page'
import { Icon } from '../../components/Icon'
import { ExerciseThumb } from '../../components/ExerciseFigure'
import { Chips, ToggleChip } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { exercises } from '../../data/exercises'
import { kindLabels, muscleLabels } from '../../data/labels'
import type { ExerciseKind } from '../../data/types'
import styles from './Exercises.module.css'

const kinds: ExerciseKind[] = ['strength', 'mobility', 'cardio', 'grip']

/** Lowercase and strip diacritics so "cucanj" finds "Čučanj". */
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd')

export function ExercisesPage() {
  const { t, l } = useT()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<ExerciseKind | null>(null)

  const list = useMemo(() => {
    const q = fold(query.trim())
    return exercises.filter(
      (e) =>
        (!kind || e.kind === kind) &&
        (!q || fold(e.name.en).includes(q) || fold(e.name.bs).includes(q)),
    )
  }, [query, kind])

  return (
    <Page title={t('exercises.title')}>
      <label className={styles.search}>
        <Icon name="search" size={20} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('exercises.search')}
          aria-label={t('exercises.search')}
        />
      </label>
      <Chips>
        <ToggleChip selected={kind === null} onClick={() => setKind(null)}>
          {t('common.all')}
        </ToggleChip>
        {kinds.map((k) => (
          <ToggleChip key={k} selected={kind === k} onClick={() => setKind(k)}>
            {l(kindLabels[k])}
          </ToggleChip>
        ))}
      </Chips>
      <div className="muted">{t('exercises.count', { n: list.length })}</div>
      {list.length === 0 && <p className="muted">{t('exercises.empty')}</p>}
      <ul className={styles.list}>
        {list.map((e) => (
          <li key={e.id}>
            <Link to={`/exercises/${e.id}`} className={styles.row}>
              <ExerciseThumb exerciseId={e.id} />
              <div className={styles.rowText}>
                <span className={styles.rowName}>{l(e.name)}</span>
                <span className={styles.rowMeta}>{e.muscles.map((m) => l(muscleLabels[m])).join(' · ')}</span>
              </div>
              <Icon name="chevronRight" size={20} className="muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
