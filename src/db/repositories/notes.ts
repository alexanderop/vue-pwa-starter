import type { Note } from '../converters'
import { toNote } from '../converters'
import { generateId } from '../generateId'
import { db } from '../schema'

export type NoteDraft = {
  title: string
  body: string
}

export async function listNotes(): Promise<Array<Note>> {
  const stored = await db.notes.toArray()
  return stored.map(toNote)
}

export async function createNote(draft: NoteDraft): Promise<Note> {
  const now = Date.now()
  const note: Note = {
    id: generateId(),
    title: draft.title,
    body: draft.body,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.notes.add(note)
  return note
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, 'title' | 'body' | 'pinned'>>,
): Promise<void> {
  await db.notes.update(id, { ...patch, updatedAt: Date.now() })
}

/**
 * Flips `pinned` based on what is currently on disk, inside a read-write
 * transaction. Deliberately not `updateNote(id, { pinned: !note.pinned })`:
 * that computes the next value from a row the caller read earlier, so two
 * rapid taps both write the same value and one of them is lost.
 */
export async function toggleNotePinned(id: string): Promise<void> {
  await db.transaction('rw', db.notes, async () => {
    const stored = await db.notes.get(id)
    if (!stored) return
    await db.notes.update(id, { pinned: !(stored.pinned ?? false), updatedAt: Date.now() })
  })
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}
