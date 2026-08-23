import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import AtomSelect from '@/components/atoms/AtomSelect.vue'
import { it as base } from '../../fixtures'

/**
 * What AtomSelect *adds* is the paint around a native control, and paint is
 * the one thing that can silently break a control: the chevron is positioned
 * over the tap target, and the wrapper it needs in order to position it is a
 * `<div>` that `id` and `for=` must not land on. Neither shows up in a
 * screenshot, and both make the control unusable.
 *
 * The `<select>` behaviour underneath is Chromium's, and is not retested
 * here — see docs/ui-components.md on what a primitive spec is for.
 */

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
] as const

const Harness = defineComponent({
  setup() {
    const chosen = ref('en')
    return { chosen }
  },
  render() {
    return h('div', [
      h('label', { for: 'locale' }, 'Language'),
      h(
        AtomSelect,
        {
          id: 'locale',
          modelValue: this.chosen,
          'onUpdate:modelValue': (value: string) => {
            this.chosen = value
          },
        },
        () => LOCALES.map((locale) => h('option', { value: locale.value }, locale.label)),
      ),
      h('output', this.chosen),
    ])
  },
})

const it = base.extend('select', async ({}, { onCleanup }) => {
  const mounted = render(Harness)
  onCleanup(() => mounted.unmount())

  return {
    control: page.getByRole('combobox', { name: 'Language' }),
    chosen: page.getByRole('status'),
    // `Element`, not `HTMLElement`: the chevron is an `<svg>`, and the only
    // thing this fixture promises is a box to aim at.
    get icon(): Element {
      const icon = document.querySelector('[data-slot="select-icon"]')
      if (icon === null) throw new Error('select icon not found')
      return icon
    },
  }
})

describe('AtomSelect', () => {
  /**
   * The wrapper is the risk. `inheritAttrs: false` is what puts `id` on the
   * `<select>` instead of on the positioning `<div>`, and without it a
   * `<label for>` points at a div — the control keeps working with a mouse
   * and stops having a name, which is invisible in every tier but this
   * assertion.
   */
  it('is named by a label pointing at it', async ({ select }) => {
    await expect.element(select.control).toBeVisible()
  })

  it('carries the choice out to the consumer', async ({ select }) => {
    await select.control.selectOptions('Deutsch')

    await expect.element(select.chosen).toHaveTextContent('de')
  })

  it('shows the choice the consumer sets', async ({ select }) => {
    await expect.element(select.control).toHaveValue('en')
  })

  /**
   * The chevron sits over the right edge of the control — exactly where a
   * thumb reaches on a phone. Without `pointer-events-none` the tap lands on
   * an SVG that does nothing, and the picker never opens. `elementFromPoint`
   * is what a tap actually resolves through, so it answers the question the
   * class name only claims to.
   */
  it('does not let its chevron swallow a tap', ({ select }) => {
    const box = select.icon.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)

    expect(
      hit?.tagName.toLowerCase(),
      'a tap on the chevron is not reaching the select — pointer-events-none is missing from [data-slot="select-icon"]',
    ).toBe('select')
  })
})
