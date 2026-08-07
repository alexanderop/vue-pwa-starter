import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listNotes } from '@/db'
import { renderApp } from '../../helpers/renderApp'
import { resetAppState } from '../../helpers/reset'

describe('notes quick-add flow', () => {
  let cleanup: (() => void) | undefined

  beforeEach(resetAppState)
  afterEach(() => cleanup?.())

  it('creates a note through the center FAB and persists it', async () => {
    ;({ cleanup } = await renderApp())

    await expect.element(page.getByText('No notes yet')).toBeVisible()

    await page.getByRole('button', { name: 'Add a note' }).click()
    await page.getByLabelText('Title', { exact: true }).fill('Buy milk')
    await page.getByLabelText('Note', { exact: true }).fill('2 liters, oat')
    await page.getByRole('button', { name: 'Save' }).click()

    // Visible in the list, confirmed by toast, and actually in IndexedDB.
    await expect.element(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()
    await expect.element(page.getByText('Note saved')).toBeVisible()

    const notes = await listNotes()
    expect(notes).toMatchObject([{ title: 'Buy milk', body: '2 liters, oat' }])
  })

  it('deletes a note from its card action', async () => {
    ;({ cleanup } = await renderApp())

    await page.getByRole('button', { name: 'Add a note' }).click()
    await page.getByLabelText('Title').fill('Temporary')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.element(page.getByRole('heading', { name: 'Temporary' })).toBeVisible()

    await page.getByRole('button', { name: 'Delete note Temporary' }).click()

    await expect.element(page.getByText('No notes yet')).toBeVisible()
    expect(await listNotes()).toHaveLength(0)
  })

  it('pins a note so it sorts first', async () => {
    ;({ cleanup } = await renderApp())

    for (const title of ['First', 'Second']) {
      await page.getByRole('button', { name: 'Add a note' }).click()
      await page.getByLabelText('Title').fill(title)
      await page.getByRole('button', { name: 'Save' }).click()
      await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
    }

    await page.getByRole('button', { name: 'Pin note First' }).click()
    await expect.element(page.getByRole('button', { name: 'Unpin note First' })).toBeVisible()

    const headings = page.getByRole('heading', { level: 3 })
    await expect.element(headings.first()).toHaveTextContent('First')
  })
})
