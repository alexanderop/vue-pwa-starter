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

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}
