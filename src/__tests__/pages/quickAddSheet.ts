import { expect, vi } from 'vitest'
import type { Locator } from 'vitest/browser'
import { page, userEvent } from 'vitest/browser'

/** What the quick-add form can be filled with — the body is optional. */
export interface NoteDraftInput {
  title: string
  body?: string
}

/**
 * The quick-add sheet (`QuickAddNoteSheet.vue`), as a test drives it.
 *
 * Owned by `NotesScreen` rather than opened directly: it is a part of that
 * screen, and it is dialog-portalled outside the mounted container, which is
 * why every locator here is queried from `page`.
 */
export class QuickAddSheet {
  get root(): Locator {
    return page.getByRole('dialog')
  }

  // `exact` matters: "Note" is a prefix of no other label today, but "Title"
  // and "Note" are both short enough that a future field would collide.
  get title(): Locator {
    return page.getByLabelText('Title', { exact: true })
  }

  get body(): Locator {
    return page.getByLabelText('Note', { exact: true })
  }

  get saveButton(): Locator {
    return page.getByRole('button', { name: 'Save' })
  }

  async fill(draft: Partial<NoteDraftInput>): Promise<void> {
    if (draft.title !== undefined) await this.title.fill(draft.title)
    if (draft.body !== undefined) await this.body.fill(draft.body)
  }

  async save(): Promise<void> {
    await this.saveButton.click()
  }

  /**
   * Two submits in the same tick — the double-tap a user can actually
   * produce, before the first write has resolved. Two awaited clicks cannot
   * express it: they serialise, and the second one lands after the sheet has
   * already closed. Hence the form element.
   */
  submitTwiceInOneTick(): void {
    const form = this.saveButton.element().closest('form')
    if (!(form instanceof HTMLFormElement)) throw new Error('quick-add form not found')
    form.requestSubmit()
    form.requestSubmit()
  }

  /** Escape stands in for the accidental tap on the overlay. */
  async dismiss(): Promise<void> {
    await userEvent.keyboard('{Escape}')
    await this.expectClosed()
  }

  /**
   * Open *and usable*, which is the only state a caller can act on.
   *
   * `toBeVisible` alone would pass for a sheet whose Save button sits below
   * the fold — visible in the CSS sense, unreachable on the device. On a
   * keyboard-shrunk viewport that is the actual failure mode, so the wait
   * that gates every interaction asserts the primary action is really on
   * screen (`toBeInViewport`, Vitest 4.0).
   */
  readonly expectReady = vi.defineHelper(async (): Promise<void> => {
    await expect.element(this.root).toBeVisible()
    await expect.element(this.saveButton).toBeInViewport()
  })

  readonly expectClosed = vi.defineHelper(async (): Promise<void> => {
    await expect.element(this.root).not.toBeInTheDocument()
  })

  /** What the form is holding — the draft survives a dismissal on purpose. */
  readonly expectDraft = vi.defineHelper(async (draft: NoteDraftInput): Promise<void> => {
    await expect.element(this.title).toHaveValue(draft.title)
    if (draft.body !== undefined) await expect.element(this.body).toHaveValue(draft.body)
  })
}
