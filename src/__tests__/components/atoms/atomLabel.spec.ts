import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import { assertNoViolations } from '../../helpers/a11y'
import { it as base } from '../../fixtures'

/**
 * A label has no behaviour of its own, which is exactly why it needs a spec:
 * everything it does is done *by the browser on its behalf*, and every one of
 * those things stops happening silently if it stops being a real `<label>`.
 * Swap the element for a styled `<span>` and the text still reads correctly,
 * still sits in the right place, and still looks like a label — while the
 * control beside it loses its name, its second hit area, and nothing throws.
 *
 * The third claim is the touch one. A label sits next to a control, which is
 * where a thumb lands, and a long-press on selectable text opens the
 * selection callout instead of toggling the thing the user aimed at.
 */

/** `peer-disabled:opacity-50`, as the browser resolves it. */
const DISABLED_OPACITY = 0.5

const Harness = defineComponent({
  render: () =>
    h('div', [
      h(AtomLabel, { for: 'agree' }, () => 'I agree'),
      h('input', { id: 'agree', type: 'checkbox', class: 'peer' }),

      // Order matters, and is the point of this pair: `peer-disabled:` is a
      // sibling selector, so the label only dims when it *follows* the
      // control it is paired with.
      h('input', { id: 'locked', type: 'checkbox', class: 'peer', disabled: true }),
      h(AtomLabel, { for: 'locked' }, () => 'Locked'),
    ]),
})

const it = base.extend('labels', async ({}, { onCleanup }) => {
  const mounted = render(Harness)
  onCleanup(() => mounted.unmount())

  return {
    container: mounted.container,
    agree: page.getByRole('checkbox', { name: 'I agree' }),
    agreeText: page.getByText('I agree'),
    get locked(): HTMLElement {
      const label = document.querySelector('label[for="locked"]')
      if (!(label instanceof HTMLElement)) throw new Error('label for #locked not found')
      return label
    },
  }
})

describe('AtomLabel', () => {
  it('has no accessibility violations', async ({ labels }) => {
    await assertNoViolations(labels.container)
  })

  /**
   * The name is the label's whole job, and it is not the label that carries
   * it — the *control* does, resolved through `for`. Querying the checkbox by
   * that name is therefore the only assertion that proves the association
   * landed; reading the label's own text proves nothing about it.
   */
  it('gives its control a name', async ({ labels }) => {
    await expect.element(labels.agree).toHaveAccessibleName('I agree')
  })

  /**
   * The second hit area. A `<label for>` forwards its clicks to the control,
   * which on a phone roughly doubles the target for a checkbox — and is
   * behaviour the browser provides only for a real label element. This is the
   * assertion that fails the moment the element changes.
   */
  it('forwards a click to its control', async ({ labels }) => {
    await expect.element(labels.agree).not.toBeChecked()

    await labels.agreeText.click()

    await expect
      .element(labels.agree, {
        message:
          'clicking the label did not reach the control — this is no longer a real <label for>, and the control has lost its second hit area',
      })
      .toBeChecked()
  })

  it('cannot be selected by a long press', ({ labels }) => {
    expect(
      getComputedStyle(labels.locked).userSelect,
      'a long press on this label opens the selection callout instead of hitting the control beside it',
    ).toBe('none')
  })

  /**
   * A disabled control with a label that still looks live reads as "this is
   * available" to everyone who is not reading the control itself. The
   * selector doing the work is `peer-disabled:`, which only resolves in a
   * browser that has laid the siblings out.
   */
  it('dims when the control it follows is disabled', ({ labels }) => {
    expect(
      Number.parseFloat(getComputedStyle(labels.locked).opacity),
      'the label beside a disabled control still renders at full strength — peer-disabled: is not matching',
    ).toBe(DISABLED_OPACITY)
  })
})
