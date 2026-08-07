import Dexie, { type Table } from 'dexie'

/** Current on-disk shape of a note (schema v2). */
export type DbNote = {
  id: string
  title: string
  body: string
  pinned: boolean
  /** Epoch milliseconds. */
  createdAt: number
  /** Epoch milliseconds. */
  updatedAt: number
}

/**
 * What may actually come back from disk: rows written by schema v1 lack
 * `pinned` and `updatedAt`. The Dexie upgrade below backfills live rows,
 * but old JSON backups can re-introduce v1 rows at import time — so all
 * reads still go through the converter (converters.ts), which normalizes
 * either shape. Keeping the stored type honest about optionality is what
 * makes the compiler enforce that.
 */
export type StoredDbNote = Omit<DbNote, 'pinned' | 'updatedAt'> &
  Partial<Pick<DbNote, 'pinned' | 'updatedAt'>>

class StarterDatabase extends Dexie {
  notes!: Table<StoredDbNote, string>

  constructor() {
    super('vue-pwa-starter')

    // v1: original shape — only id and a createdAt index.
    this.version(1).stores({
      notes: 'id, createdAt',
    })

    // v2: adds `pinned` and `updatedAt`. The upgrade backfills existing rows
    // so post-upgrade data is complete; the converter guards everything else.
    // This is the pattern to copy for your own schema changes: bump the
    // version, migrate forward, and keep reads defensive for data that
    // bypasses the migration (imports, sync).
    this.version(2)
      .stores({
        notes: 'id, createdAt, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table<StoredDbNote>('notes')
          .toCollection()
          .modify((note) => {
            note.pinned ??= false
            note.updatedAt ??= note.createdAt
          })
      })
  }
}

export const db = new StarterDatabase()

/**
 * Deletes and reopens the database. Used by tests for isolation; also the
 * seam for a "delete all data" action.
 */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
}
