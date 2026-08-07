import { describe, expect, it } from '@effect/vitest'
import { Clock, Effect } from 'effect'
import { TestClock } from 'effect/testing'
import type { Note } from '@/db'
import { noteAge, sortNotes } from '@/features/notes/domain'

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

/**
 * This is what reading time from the Clock service buys: `it.effect` swaps
 * in TestClock, so every bucket boundary is pinned by adjusting time
 * forward — no vi.useFakeTimers, no Date mocking, no flaky "almost 60s"
 * sleeps. The edit happens at the TestClock's current instant; the
 * assertions then travel to exactly the moment under test.
 */
describe('noteAge', () => {
  it.effect('stays "just now" for the whole first minute', () =>
    Effect.gen(function* () {
      const editedAt = yield* Clock.currentTimeMillis

      yield* TestClock.adjust('59 seconds')

      expect(yield* noteAge(editedAt)).toEqual({ unit: 'justNow' })
    }),
  )

  it.effect('ticks over to minutes at exactly 60 seconds', () =>
    Effect.gen(function* () {
      const editedAt = yield* Clock.currentTimeMillis

      yield* TestClock.adjust('60 seconds')

      expect(yield* noteAge(editedAt)).toEqual({ unit: 'minutes', count: 1 })
    }),
  )

  it.effect('reports whole hours once minutes run out', () =>
    Effect.gen(function* () {
      const editedAt = yield* Clock.currentTimeMillis

      yield* TestClock.adjust('90 minutes')

      expect(yield* noteAge(editedAt)).toEqual({ unit: 'hours', count: 1 })
    }),
  )

  it.effect('reports days from 24 hours on', () =>
    Effect.gen(function* () {
      const editedAt = yield* Clock.currentTimeMillis

      yield* TestClock.adjust('3 days')

      expect(yield* noteAge(editedAt)).toEqual({ unit: 'days', count: 3 })
    }),
  )

  it.effect('clamps a future updatedAt (clock skew, imported backup) to "just now"', () =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis

      expect(yield* noteAge(now + 5 * 60_000)).toEqual({ unit: 'justNow' })
    }),
  )
})
