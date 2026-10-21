import { useRef, useState } from 'react'
import { Page } from '../../components/Page'
import { LangToggle } from '../../components/LangToggle'
import { Button, Card } from '../../components/ui'
import { useT } from '../../i18n/I18nProvider'
import { saveSetting, useSettings, type Settings } from '../../db/settings'
import { downloadBackup, exportBackup, importBackup, parseBackup } from '../../db/backup'
import styles from './Me.module.css'

type TextKey = 'playlistUrl' | 'walkoutUrl'

export function MePage() {
  const { t } = useT()
  const settings = useSettings()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!settings) return null

  const save = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    void saveSetting(key, value).then(() => setMessage(t('me.saved')))
  }

  const textField = (key: TextKey, label: string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="url"
        inputMode="url"
        defaultValue={settings[key]}
        placeholder="https://"
        onBlur={(e) => e.target.value !== settings[key] && save(key, e.target.value.trim())}
      />
    </label>
  )

  const onImport = async (file: File) => {
    try {
      const backup = parseBackup(await file.text())
      const date = backup.exportedAt.slice(0, 10)
      if (!window.confirm(t('me.importConfirm', { date }))) return
      await importBackup(backup)
      setMessage(t('me.imported'))
    } catch {
      setMessage(t('me.importError'))
    }
  }

  return (
    <Page title={t('me.title')} actions={<LangToggle />}>
      {message && (
        <div className={styles.message} role="status">
          {message}
        </div>
      )}

      <Card>
        <div className="label">{t('me.program')}</div>
        <label className={styles.field}>
          <span>{t('me.startDate')}</span>
          <input
            type="date"
            defaultValue={settings.startDate}
            onChange={(e) => e.target.value && save('startDate', e.target.value)}
          />
        </label>
        <div className="muted">{t('me.startHint')}</div>
        <label className={styles.field}>
          <span>{t('me.stepGoal')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1000}
            step={500}
            defaultValue={settings.stepGoal}
            onBlur={(e) => {
              const n = Math.round(Number(e.target.value))
              if (n >= 1000 && n !== settings.stepGoal) save('stepGoal', n)
            }}
          />
        </label>
      </Card>

      <Card>
        <div className="label">{t('me.music')}</div>
        {textField('playlistUrl', t('me.playlist'))}
        {textField('walkoutUrl', t('me.walkout'))}
      </Card>

      <Card>
        <div className="label">{t('me.backup')}</div>
        <div className="muted">{t('me.backupHint')}</div>
        <Button block onClick={async () => downloadBackup(await exportBackup())}>
          {t('me.export')}
        </Button>
        <Button variant="secondary" block onClick={() => fileInput.current?.click()}>
          {t('me.import')}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void onImport(file)
            e.target.value = ''
          }}
        />
      </Card>

      <div className={styles.version}>Corner v{__APP_VERSION__}</div>
    </Page>
  )
}
