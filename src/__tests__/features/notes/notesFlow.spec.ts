import { Effect } from 'effect'
import { describe, expect } from 'vitest'
import { listNotes, runDb } from '@/db'
import { it } from '../../fixtures'

/** What actually reached IndexedDB — the screen object stops at the UI. */
const storedNotes = () => runDb(listNotes.pipe(Effect.orDie))

describe('notes quick-add flow', () => {
  it('creates a note through the center FAB and persists it', async ({ notes }) => {
    await notes.expectNoNotes()

    await notes.addNote({ title: 'Buy milk', body: '2 liters, oat' })

    // Visible in the list, confirmed by toast, and actually in IndexedDB.
    await notes.expectNote('Buy milk')
    await notes.expectToast('Note saved')
    expect(await storedNotes()).toMatchObject([{ title: 'Buy milk', body: '2 liters, oat' }])
  })

  it('deletes a note from its card action', async ({ notes }) => {
    await notes.addNote({ title: 'Temporary' })
    await notes.expectNote('Temporary')

    await notes.deleteNote('Temporary')

    await notes.expectNoNotes()
    expect(await storedNotes()).toHaveLength(0)
  })

  it('keeps the draft when the sheet is dismissed by accident', async ({ notes }) => {
    await notes.openQuickAdd()
    await notes.quickAdd.fill({ title: 'Half typed', body: '…and a body' })
    await notes.quickAdd.dismiss()

    await notes.openQuickAdd()
    await notes.quickAdd.expectDraft({ title: 'Half typed', body: '…and a body' })
  })

  it('starts from an empty draft after a successful save', async ({ notes }) => {
    await notes.addNote({ title: 'Saved and gone' })
    await notes.expectNote('Saved and gone')

    await notes.openQuickAdd()

    await notes.quickAdd.expectDraft({ title: '' })
  })

  // Tagged `flaky`: the test deliberately races two submits against a write
  // that has not resolved, so a loaded CI runner can lose the race for
  // reasons that are not the bug it guards. The tag carries the CI-only
  // retry (see `tags` in vitest.config.ts) — the point is that the retry
  // lives with the category, not copied onto this one test.
  it(
    'creates a single note when the form is submitted twice in a row',
    { tags: ['flaky'] },
    async ({ notes }) => {
      await notes.openQuickAdd()
      await notes.quickAdd.fill({ title: 'Only once' })
      notes.quickAdd.submitTwiceInOneTick()

      await expect.poll(async () => (await storedNotes()).length).toBe(1)
      await notes.expectNote('Only once')
    },
  )

  it('pins a note so it sorts first', async ({ notes }) => {
    await notes.addNote({ title: 'First' })
    await notes.addNote({ title: 'Second' })

    await notes.pinNote('First')

    await notes.expectPinned('First')
    await notes.expectOrder(['First', 'Second'])
  })
})
