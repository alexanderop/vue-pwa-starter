import { z } from 'zod'
import { toNote } from './converters'
import { db } from './schema'

export const BACKUP_VERSION = 2

// Accepts both current (v2) and legacy (v1) note shapes — the converter
// normalizes on import. Data exported by any historical version of the app
// must stay importable ("The Long Now").
const storedNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  body: z.string(),
  pinned: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
})

const backupSchema = z.object({
  app: z.literal('vue-pwa-starter'),
  version: z.number().int().min(1).max(BACKUP_VERSION),
  exportedAt: z.string(),
  notes: z.array(storedNoteSchema),
})

export type BackupPayload = z.infer<typeof backupSchema>

export async function exportData(): Promise<BackupPayload> {
  const notes = await db.notes.toArray()
  return {
    app: 'vue-pwa-starter',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    notes: notes.map(toNote),
  }
}

/**
 * Validates and imports a backup payload. Throws (ZodError) on anything that
 * is not a backup file; existing rows with matching ids are overwritten.
 * Returns the number of imported notes.
 */
export async function importData(payload: unknown): Promise<number> {
  const parsed = backupSchema.parse(payload)
  const notes = parsed.notes.map(toNote)
  await db.notes.bulkPut(notes)
  return notes.length
}
