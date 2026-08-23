import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import {
  MoleculeDialog,
  MoleculeDialogClose,
  MoleculeDialogContent,
  MoleculeDialogDescription,
  MoleculeDialogFooter,
  MoleculeDialogHeader,
  MoleculeDialogOverlay,
  MoleculeDialogTitle,
  MoleculeDialogTrigger,
} from '@/components/molecules/dialog'
import { i18n } from '@/i18n'
import { assertNoViolations } from '../../../helpers/a11y'
import { it as base } from '../../../fixtures'

/**
 * The parts, wired together — which is the only state in which any of them
 * means anything. Nine files share one provider, and every promise they make
 * is a promise about the *others*: the title publishes an id the content
 * points `aria-labelledby` at, the close button reads open state from a
 * provider rather than a prop, the footer orders controls the header knows
 * nothing about. Testing them one at a time would test nine components that
 * render a `<div>`.
 *
 * `dialogContent.spec.ts` is the other half of this directory and covers what
 * the content part adds on its own: a scroll region that survives a
 * keyboard-shrunk viewport. This file covers the composition.
 */

/** Narrow enough that the `sm:` breakpoint does not apply — a phone. */
const PHONE_WIDTH = 390
const PHONE_HEIGHT = 844

const Harness = defineComponent({
  render: () =>
    h(MoleculeDialog, null, () => [
      h(MoleculeDialogTrigger, null, () => 'Delete note'),
      h(MoleculeDialogOverlay),
      h(MoleculeDialogContent, null, () => [
        h(MoleculeDialogHeader, null, () => [
          h(MoleculeDialogTitle, () => 'Delete this note?'),
          h(MoleculeDialogDescription, () => 'This cannot be undone.'),
        ]),
        h(MoleculeDialogFooter, null, () => [
          // Cancel first, Delete second — shadcn's canonical order, and what
          // the reversal test below measures against.
          h(MoleculeDialogClose, null, () => 'Cancel'),
          h('button', { type: 'button' }, 'Delete'),
        ]),
      ]),
    ]),
})

const it = base
  .extend('dialog', async ({}, { onCleanup }) => {
    const mounted = render(Harness, { global: { plugins: [i18n] } })
    onCleanup(() => mounted.unmount())

    return {
      container: mounted.container,
      trigger: page.getByRole('button', { name: 'Delete note' }),
      sheet: page.getByRole('dialog'),
      cancel: page.getByRole('button', { name: 'Cancel' }),
      confirm: page.getByRole('button', { name: 'Delete' }),
      async open(): Promise<void> {
        await page.getByRole('button', { name: 'Delete note' }).click()
        await expect.element(page.getByRole('dialog')).toBeVisible()
      },
    }
  })
  /**
   * The `sm:` breakpoint decides the footer's axis, so the viewport is part
   * of the scenario rather than ambient. As a fixture because it is global
   * state: a test that resized the page and did not put it back would change
   * how every later test in the tier lays out.
   */
  .extend('phone', async ({}, { onCleanup }) => {
    const [width, height] = [window.innerWidth, window.innerHeight]
    onCleanup(async () => {
      await page.viewport(width, height)
    })

    await page.viewport(PHONE_WIDTH, PHONE_HEIGHT)
  })

/** Resolves an IDREF the way an assistive technology does — or fails loudly. */
function referenced(element: Element, attribute: string): Element {
  const id = element.getAttribute(attribute)
  if (id === null) throw new Error(`${attribute} is not set`)
  const target = document.getElementById(id)
  if (target === null) throw new Error(`${attribute}="${id}" points at nothing`)
  return target
}

describe('dialog', () => {
  it('has no accessibility violations while open', async ({ dialog }) => {
    await dialog.open()

    await assertNoViolations(document.body)
  })

  it('opens from its trigger', async ({ dialog }) => {
    expect(dialog.sheet.elements()).toHaveLength(0)

    await dialog.open()

    await expect.element(dialog.sheet).toBeVisible()
  })

  /**
   * The whole point of the compound. `aria-labelledby` and `aria-describedby`
   * are ids the content receives from parts it never sees, so the failure
   * mode is a *dangling reference*: the attribute is present, the value looks
   * plausible, and it points at nothing — at which point the dialog is
   * announced as unnamed and the warning it exists to give is never read out.
   *
   * An ARIA snapshot cannot express this. It shows the name a tree resolved
   * to, not whether the IDREF that produced it still resolves, which is why
   * the ids are followed by hand here.
   */
  it('is named and described by the parts that published those ids', async ({ dialog }) => {
    await dialog.open()

    const sheet = dialog.sheet.element()
    expect(referenced(sheet, 'aria-labelledby').textContent).toBe('Delete this note?')
    expect(referenced(sheet, 'aria-describedby').textContent).toBe('This cannot be undone.')

    await expect.element(dialog.sheet).toHaveAccessibleName('Delete this note?')
    await expect.element(dialog.sheet).toHaveAccessibleDescription('This cannot be undone.')
  })

  /**
   * Escape is the exit every modal owes a keyboard user, and it is the one
   * that disappears silently: the close button still works, so the dialog is
   * dismissible by every test that clicks it, and only someone with no mouse
   * finds out.
   */
  it('closes on Escape', async ({ dialog }) => {
    await dialog.open()

    await userEvent.keyboard('{Escape}')

    await expect.poll(() => dialog.sheet.elements()).toHaveLength(0)
  })

  /**
   * `MoleculeDialogClose` reads the open state from the provider rather than
   * from a prop, which is what lets a consumer put it anywhere — here, in the
   * footer rather than beside the content it closes.
   */
  it('closes from a close button anywhere inside it', async ({ dialog }) => {
    await dialog.open()

    await dialog.cancel.click()

    await expect.poll(() => dialog.sheet.elements()).toHaveLength(0)
  })

  /**
   * The footer deliberately makes DOM order and visual order disagree, and
   * only on a phone. DOM order is the reading order a keyboard and a screen
   * reader get; the reversed column is the order a thumb gets. So the claim
   * is the disagreement itself — the second control in the markup renders
   * *above* the first below `sm:`, and the two agree again from `sm:` up.
   *
   * Stated that way rather than as "the confirming action is at the bottom",
   * because which control that is depends on the order the call site writes,
   * and `MoleculeDialogFooter.vue` and the app disagree about that today.
   * Asserting the mechanism is honest; asserting the intent would be encoding
   * a product decision nobody has made. See the note in docs/ui-components.md.
   */
  it('reverses the visual order of its controls on a phone, and only there', async ({
    dialog,
    phone,
  }) => {
    expect(phone).toBeUndefined()
    await dialog.open()

    // `cancel` is first in the markup, `confirm` second.
    const first = () => dialog.cancel.element().getBoundingClientRect()
    const second = () => dialog.confirm.element().getBoundingClientRect()

    expect(
      second().top,
      'the footer is not reversing below sm: — DOM order and thumb order are the same, so the reversal is doing nothing',
    ).toBeLessThan(first().top)

    await page.viewport(1024, PHONE_HEIGHT)

    await expect
      .poll(() => second().left > first().left, {
        message:
          'the footer stayed a reversed column at desktop width — sm:flex-row is not taking over',
      })
      .toBe(true)
    expect(second().top).toBe(first().top)
  })
})
