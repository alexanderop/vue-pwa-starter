import type { DbNote, StoredDbNote } from './schema'

/** Domain shape the app works with — always complete. */
export type Note = DbNote

/**
 * Normalizes a stored row (possibly written by an older schema version or
 * re-imported from an old backup) into a complete domain object. Pure and
 * total: never throws, never returns partial data — that keeps data written
 * by any historical version of the app readable ("The Long Now").
 */
export function toNote(stored: StoredDbNote): Note {
  return {
    id: stored.id,
    title: stored.title,
    body: stored.body,
    pinned: stored.pinned ?? false,
    updatedAt: stored.updatedAt ?? stored.createdAt,
    createdAt: stored.createdAt,
  }
}
