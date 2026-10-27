import { Sheet } from '../../components/Sheet'
import { Icon } from '../../components/Icon'
import { Button, Chips, ToggleChip } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import type { Track } from '../../db/db'
import { saveSetting } from '../../db/settings'
import { next, playTracks, prev, stop, toggle, useMusic } from '../../hooks/music'
import styles from './Music.module.css'

interface MusicSheetProps {
  open: boolean
  onClose: () => void
  tracks: Track[]
  shuffle: boolean
}

/** Controls for the songs stored in the app: play/pause, skip, shuffle, pick a song. */
export function MusicSheet({ open, onClose, tracks, shuffle }: MusicSheetProps) {
  const { t } = useT()
  const music = useMusic()
  const current = music.queue[music.index] as Track | undefined

  return (
    <Sheet open={open} onClose={onClose} title={t('player.musicTitle')}>
      {tracks.length === 0 ? (
        <div className="muted">{t('music.empty')}</div>
      ) : (
        <>
          <div className={styles.nowPlaying}>{current ? current.name : <span className="muted">{t('music.nothing')}</span>}</div>
          <div className={styles.transport}>
            <button type="button" className={styles.round} onClick={prev} disabled={!current} aria-label={t('music.prev')}>
              <Icon name="skipPrev" size={22} />
            </button>
            <button
              type="button"
              className={`${styles.round} ${styles.main}`}
              onClick={() => (current ? toggle() : playTracks(tracks, randomStart(tracks, shuffle), shuffle))}
              aria-label={music.playing ? t('music.pause') : t('music.play')}
            >
              <Icon name={music.playing ? 'pause' : 'play'} size={28} />
            </button>
            <button type="button" className={styles.round} onClick={next} disabled={!current} aria-label={t('music.next')}>
              <Icon name="skipNext" size={22} />
            </button>
          </div>
          <Chips>
            <ToggleChip selected={shuffle} onClick={() => void saveSetting('musicShuffle', !shuffle)} aria-pressed={shuffle}>
              <Icon name="shuffle" size={16} /> {t('music.shuffle')}
            </ToggleChip>
          </Chips>
          <ol className={styles.list}>
            {tracks.map((track, i) => (
              <li key={track.id}>
                <button
                  type="button"
                  className={`${styles.row} ${track.id === current?.id ? styles.current : ''}`}
                  aria-current={track.id === current?.id ? 'true' : undefined}
                  onClick={() => playTracks(tracks, i, shuffle)}
                >
                  <span className={styles.rowIcon}>{track.id === current?.id && <Icon name="music" size={16} />}</span>
                  <span className={styles.rowName}>{track.name}</span>
                </button>
              </li>
            ))}
          </ol>
          {current && (
            <Button variant="secondary" block onClick={stop}>
              {t('music.stop')}
            </Button>
          )}
        </>
      )}
    </Sheet>
  )
}

/** With shuffle on, start on a random song instead of always the first one. */
export function randomStart(tracks: Track[], shuffle: boolean): number {
  return shuffle ? Math.floor(Math.random() * tracks.length) : 0
}
