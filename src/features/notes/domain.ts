import type { Note } from '@/db'

/** Pinned notes first, then most recently updated. Pure — unit-tier tested. */
export function sortNotes(notes: ReadonlyArray<Note>): Array<Note> {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt - a.updatedAt
  })
}
