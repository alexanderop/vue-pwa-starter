/**
 * The file end of backup export/import: turning a payload into a downloaded
 * file and a picked file back into a payload.
 *
 * What a backup *contains* and whether it is valid is `@/db`'s business
 * (src/db/backup.ts owns serialization and schema validation) — this module
 * only moves it across the browser boundary.
 */
import { downloadBlob } from './download'

/** Stem of every exported backup file; the export date is appended. */
const BACKUP_FILENAME_STEM = 'vue-pwa-starter-backup'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Date-stamped name for a backup file, derived from the payload's own
 * `exportedAt` timestamp — the file is named after the data it holds, not
 * after the clock at save time.
 *
 * A timestamp that is not an ISO date is dropped instead of trusted: the rest
 * of an ISO string contains `:` (illegal in Windows filenames) and a
 * hand-edited payload could carry a path separator, so nothing unvalidated
 * reaches the filename.
 */
export function backupFilename(exportedAt: string): string {
  const day = exportedAt.slice(0, 10)

  return ISO_DATE.test(day) ? `${BACKUP_FILENAME_STEM}-${day}.json` : `${BACKUP_FILENAME_STEM}.json`
}

/** Serialize a backup payload and hand it to the browser as a download. */
export function downloadBackup(payload: { exportedAt: string }): void {
  const json = JSON.stringify(payload, null, 2)

  downloadBlob(new Blob([json], { type: 'application/json' }), backupFilename(payload.exportedAt))
}

/**
 * Read a user-picked file into a payload. Throws on anything that is not
 * JSON; whether the JSON is actually a backup is `importData`'s call.
 */
export async function readBackupFile(file: File): Promise<unknown> {
  const payload: unknown = JSON.parse(await file.text())

  return payload
}
