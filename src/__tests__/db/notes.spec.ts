import { beforeEach, describe, expect, it } from 'vitest'
import { createNote, deleteNote, listNotes, toggleNotePinned, updateNote } from '@/db'
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

  it('toggles pinned against the stored row', async () => {
    const created = await createNote({ title: 'Pin me', body: '' })

    await toggleNotePinned(created.id)
    expect((await listNotes())[0]?.pinned).toBe(true)

    await toggleNotePinned(created.id)
    expect((await listNotes())[0]?.pinned).toBe(false)
  })

  it('does not lose a toggle when two run concurrently', async () => {
    const created = await createNote({ title: 'Double tap', body: '' })

    // Both toggles read the current value inside their own transaction, so
    // they compose: false -> true -> false. Computing from a row read before
    // the taps would leave it stuck at true.
    await Promise.all([toggleNotePinned(created.id), toggleNotePinned(created.id)])

    expect((await listNotes())[0]?.pinned).toBe(false)
  })

  it('ignores a toggle for a note that no longer exists', async () => {
    await expect(toggleNotePinned('missing')).resolves.toBeUndefined()
  })

  it('deletes a note', async () => {
    const created = await createNote({ title: 'Gone soon', body: '' })

    await deleteNote(created.id)

    expect(await listNotes()).toHaveLength(0)
  })
})
