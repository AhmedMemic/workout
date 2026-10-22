import { db as defaultDb, tableNames, type CornerDB } from './db'
import { saveSetting } from './settings'
import { today } from '../logic/dates'

const FORMAT = 'corner-backup'
const VERSION = 1

export interface Backup {
  format: typeof FORMAT
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

export async function exportBackup(db: CornerDB = defaultDb): Promise<Backup> {
  const tables: Record<string, unknown[]> = {}
  for (const name of tableNames) tables[name] = await db.table(name).toArray()
  return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), tables }
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text) as Partial<Backup>
  if (data.format !== FORMAT || typeof data.tables !== 'object' || !data.tables) {
    throw new Error('Not a Corner backup file')
  }
  if ((data.version ?? 0) > VERSION) throw new Error('Backup is from a newer version of Corner')
  return data as Backup
}

/** Replaces everything on this device with the backup's contents. */
export async function importBackup(backup: Backup, db: CornerDB = defaultDb): Promise<void> {
  await db.transaction('rw', tableNames.map((n) => db.table(n)), async () => {
    for (const name of tableNames) {
      const table = db.table(name)
      await table.clear()
      const rows = backup.tables[name]
      if (Array.isArray(rows) && rows.length) await table.bulkAdd(rows)
    }
  })
}

export function backupFileName(date = new Date()): string {
  return `corner-backup-${date.toISOString().slice(0, 10)}.json`
}

export function downloadBackup(backup: Backup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName()
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * A file the share sheet accepts. Chrome won't share .json, so fall back to the same
 * content as .txt (import accepts both).
 */
function shareableFile(backup: Backup): File | undefined {
  if (typeof navigator === 'undefined' || !navigator.canShare) return undefined
  const json = JSON.stringify(backup, null, 2)
  const base = backupFileName().replace(/\.json$/, '')
  const candidates = [
    new File([json], `${base}.json`, { type: 'application/json' }),
    new File([json], `${base}.txt`, { type: 'text/plain' }),
  ]
  return candidates.find((f) => navigator.canShare({ files: [f] }))
}

export function canShareBackup(): boolean {
  return !!shareableFile({ format: FORMAT, version: VERSION, exportedAt: '', tables: {} })
}

/**
 * Backs everything up and remembers when. `share` opens the phone's share sheet
 * (Google Drive, email…); otherwise the file goes to Downloads.
 * Returns false if the share sheet was cancelled.
 */
export async function backUpNow(how: 'download' | 'share'): Promise<boolean> {
  const backup = await exportBackup()
  if (how === 'share') {
    const file = shareableFile(backup)
    if (!file) return false
    try {
      await navigator.share({ files: [file], title: 'Corner backup' })
    } catch {
      return false
    }
  } else {
    downloadBackup(backup)
  }
  await saveSetting('lastBackupAt', today())
  return true
}
