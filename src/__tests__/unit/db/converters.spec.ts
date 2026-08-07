import { describe, expect, it } from 'vitest'
import { toNote } from '@/db/converters'

describe('toNote', () => {
  it('normalizes a v1-era row (no pinned, no updatedAt)', () => {
    const note = toNote({ id: 'a', title: 'Old row', body: '', createdAt: 111 })

    expect(note).toEqual({
      id: 'a',
      title: 'Old row',
      body: '',
      pinned: false,
      createdAt: 111,
      updatedAt: 111,
    })
  })

  it('passes a complete v2 row through unchanged', () => {
    const stored = {
      id: 'b',
      title: 'Current row',
      body: 'text',
      pinned: true,
      createdAt: 100,
      updatedAt: 200,
    }

    expect(toNote(stored)).toEqual(stored)
  })
})
