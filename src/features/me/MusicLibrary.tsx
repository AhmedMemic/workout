import { useRef, useState } from 'react'
import { Button, Card } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n/I18nProvider'
import { addTracks, deleteTrack, useTracks } from '../../db/queries'
import { forget } from '../../hooks/music'
import { formatSize } from '../../logic/music'
import styles from './Me.module.css'

/** Songs copied from the phone into the app, for the in-app music player. */
export function MusicLibrary() {
  const { t } = useT()
  const tracks = useTracks()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!tracks) return null
  const total = tracks.reduce((sum, tr) => sum + tr.size, 0)

  const onAdd = async (files: File[]) => {
    setBusy(true)
    try {
      setMessage(t('me.songsAdded', { n: await addTracks(files) }))
    } catch {
      // usually the phone is out of space
      setMessage(t('me.songsError'))
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async (id: number, name: string) => {
    if (!window.confirm(t('me.deleteSongConfirm', { name }))) return
    forget(id)
    await deleteTrack(id)
  }

  return (
    <Card>
      <div className="label">{t('me.myMusic')}</div>
      <div className="muted">{t('me.myMusicHint')}</div>
      {tracks.length > 0 && <div className="muted">{t('me.songsTotal', { n: tracks.length, size: formatSize(total) })}</div>}
      {tracks.length > 0 && (
        <ul className={styles.songs}>
          {tracks.map((track) => (
            <li key={track.id} className={styles.song}>
              <span className={styles.songName}>{track.name}</span>
              <button
                type="button"
                className={styles.songDelete}
                onClick={() => void onDelete(track.id!, track.name)}
                aria-label={t('me.deleteSong', { name: track.name })}
              >
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && (
        <div className={styles.message} role="status">
          {message}
        </div>
      )}
      <Button block disabled={busy} onClick={() => fileInput.current?.click()}>
        <Icon name="plus" size={18} /> {t('me.addSongs')}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) void onAdd(files)
          e.target.value = ''
        }}
      />
    </Card>
  )
}
