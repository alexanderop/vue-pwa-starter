import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import AtomInput from '@/components/atoms/AtomInput.vue'
import { assertNoViolations } from '../../helpers/a11y'
import { it as base } from '../../fixtures'

/**
 * A text field on a phone, where the two ways to ruin one are both silent.
 *
 * The first is the 16px floor: mobile Safari zooms the whole page in when a
 * field with a font smaller than 16px takes focus, and does not zoom back
 * out. Nothing about that is visible on a desktop run or in a screenshot —
 * `text-sm` looks tidier, ships, and the app starts lurching every time a
 * user taps a field. The second is the touch floor, for the same reason every
 * other control has one.
 *
 * Neither is a claim the type system, the arch tier or a class-string
 * assertion can make. Both are the browser's resolved computed values.
 */

/** `--spacing-touch-target`, in px at the 16px root. */
const TOUCH_TARGET = 44

/** Below this, mobile Safari zooms the page on focus and never zooms back. */
const NO_ZOOM_FONT_SIZE = 16

const Harness = defineComponent({
  setup() {
    const title = ref('')
    return { title }
  },
  render() {
    return h('div', [
      h('label', { for: 'title' }, 'Title'),
      h(AtomInput, {
        id: 'title',
        modelValue: this.title,
        placeholder: 'Something to remember',
        'onUpdate:modelValue': (value: string) => {
          this.title = value
        },
      }),
      h('output', this.title),
    ])
  },
})

const it = base.extend('field', async ({}, { onCleanup }) => {
  const mounted = render(Harness)
  onCleanup(() => mounted.unmount())

  return {
    container: mounted.container,
    control: page.getByRole('textbox', { name: 'Title' }),
    echo: page.getByRole('status'),
  }
})

describe('AtomInput', () => {
  it('has no accessibility violations', async ({ field }) => {
    await assertNoViolations(field.container)
  })

  it('is named by the label pointing at it', async ({ field }) => {
    await expect.element(field.control).toHaveAccessibleName('Title')
  })

  /**
   * `fill` is real typing through the browser's input pipeline, so this
   * covers the whole `defineModel` round trip — the value reaching the DOM,
   * the input event, and the update arriving back at the consumer. A
   * `setValue` on the element would skip the middle of that and still pass.
   */
  it('carries what the user types out to the consumer', async ({ field }) => {
    await field.control.fill('Buy milk')

    await expect.element(field.echo).toHaveTextContent('Buy milk')
  })

  it('does not zoom the page when a phone focuses it', ({ field }) => {
    const fontSize = Number.parseFloat(getComputedStyle(field.control.element()).fontSize)

    expect(
      fontSize,
      'the field renders below 16px — mobile Safari zooms the page in on focus and never zooms back out',
    ).toBeGreaterThanOrEqual(NO_ZOOM_FONT_SIZE)
  })

  it('is tall enough to hit with a thumb', ({ field }) => {
    expect(
      Math.round(field.control.element().getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(TOUCH_TARGET)
  })

  /**
   * `focus-visible`, not `focus`: the ring is meant for the keyboard user who
   * cannot otherwise tell where they are, and is meant *not* to appear on a
   * tap. That distinction is the browser's heuristic — there is no such
   * pseudo-class outside a real engine — so arriving by `tab()` is the only
   * way to ask whether the ring a keyboard user depends on is actually
   * reachable.
   */
  it('shows its focus ring to a keyboard user', async ({ field }) => {
    await userEvent.tab()

    await expect.element(field.control).toHaveFocus()
    expect(
      field.control.element().matches(':focus-visible'),
      'the field took keyboard focus without matching :focus-visible — the ring never renders and a keyboard user cannot see where they are',
    ).toBe(true)
  })
})
