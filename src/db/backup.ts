import { db as defaultDb, tableNames, type CornerDB } from './db'

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
