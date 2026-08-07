import { describe, expect, it } from 'vitest'
import type { Note } from '@/db'
import { sortNotes } from '@/features/notes/domain'

function makeNote(overrides: Partial<Note> & Pick<Note, 'id'>): Note {
  return {
    title: overrides.id,
    body: '',
    pinned: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('sortNotes', () => {
  it('puts pinned notes first, each group newest-updated first', () => {
    const notes = [
      makeNote({ id: 'old', updatedAt: 1 }),
      makeNote({ id: 'pinned-old', pinned: true, updatedAt: 2 }),
      makeNote({ id: 'new', updatedAt: 9 }),
      makeNote({ id: 'pinned-new', pinned: true, updatedAt: 5 }),
    ]

    expect(sortNotes(notes).map((note) => note.id)).toEqual([
      'pinned-new',
      'pinned-old',
      'new',
      'old',
    ])
  })

  it('does not mutate its input', () => {
    const notes = [makeNote({ id: 'b', updatedAt: 1 }), makeNote({ id: 'a', updatedAt: 2 })]
    const snapshot = [...notes]

    sortNotes(notes)

    expect(notes).toEqual(snapshot)
  })
})
