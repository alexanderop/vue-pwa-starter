import { beforeEach, describe, expect, it } from 'vitest'
import { createNote, deleteNote, listNotes, updateNote } from '@/db'
import { resetDatabase } from '@/db'

describe('notes repository', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('creates and lists notes', async () => {
    await createNote({ title: 'First', body: 'body' })

    const notes = await listNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ title: 'First', body: 'body', pinned: false })
  })

  it('updates a note and bumps updatedAt', async () => {
    const created = await createNote({ title: 'Pin me', body: '' })

    await updateNote(created.id, { pinned: true })

    const [note] = await listNotes()
    expect(note?.pinned).toBe(true)
    expect(note?.updatedAt).toBeGreaterThanOrEqual(created.updatedAt)
  })

  it('deletes a note', async () => {
    const created = await createNote({ title: 'Gone soon', body: '' })

    await deleteNote(created.id)

    expect(await listNotes()).toHaveLength(0)
  })
})
