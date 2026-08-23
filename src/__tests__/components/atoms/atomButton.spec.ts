import { ChevronLeft } from '@lucide/vue'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'
import { assertNoViolations } from '../../helpers/a11y'
import { it as base } from '../../fixtures'

/**
 * The most-copied primitive in the app, and the one whose failures are all
 * invisible to a reader of the source: every claim below is something the
 * browser resolves — a computed transition list, a hit test, an icon sized by
 * a descendant selector — and every one of them reads as correct in the class
 * string whether it works or not.
 *
 * The 44px touch floor is *not* here. `size: default` compiles to
 * `h-touch-target pointer-fine:h-10`, so this tier — a stock desktop Chromium,
 * where `pointer: fine` matches — measures the collapsed 40px on purpose.
 * The floor is a claim about a phone and belongs to the tier that emulates
 * one: `touch/touchTargets.spec.ts`. See docs/touch-conventions.md.
 */

const Harness = defineComponent({
  render: () =>
    h('div', [
      h(AtomButton, () => 'Save'),
      h(AtomButton, { disabled: true }, () => 'Locked'),
      h(AtomButton, { asChild: true }, () => h('a', { href: '#docs' }, 'Docs')),
      // No `class` on the icon, which is the branch under test: the base
      // sizes only the icons a consumer has *not* sized.
      h(AtomButton, { size: 'icon', 'aria-label': 'Back' }, () => h(ChevronLeft)),
    ]),
})

function boxOf(locator: { element: () => Element }): DOMRect {
  return locator.element().getBoundingClientRect()
}

const it = base.extend('buttons', async ({}, { onCleanup }) => {
  const mounted = render(Harness)
  onCleanup(() => mounted.unmount())

  return {
    container: mounted.container,
    save: page.getByRole('button', { name: 'Save' }),
    locked: page.getByRole('button', { name: 'Locked' }),
    docs: page.getByRole('link', { name: 'Docs' }),
    back: page.getByRole('button', { name: 'Back' }),
    get painted(): ReadonlyArray<string> {
      return [...document.querySelectorAll('[data-slot="button"]')].map((element) =>
        element.tagName.toLowerCase(),
      )
    },
  }
})

describe('AtomButton', () => {
  it('has no accessibility violations', async ({ buttons }) => {
    await assertNoViolations(buttons.container)
  })

  /**
   * `as-child` is the escape hatch that keeps the button from growing an
   * `href` prop. What it has to do is *replace* itself with the consumer's
   * element rather than wrap it — a link nested inside a styled button is
   * still clickable, so nothing looks wrong until a keyboard user tabs onto
   * the wrapper instead of the link.
   */
  it('hands its paint to the consumer’s element under as-child', async ({ buttons }) => {
    await expect.element(buttons.docs).toBeVisible()

    expect(
      buttons.painted,
      'as-child rendered a wrapper of its own — the anchor should *be* the button, not sit inside one',
    ).toEqual(['button', 'button', 'a', 'button'])
  })

  /**
   * `disabled:pointer-events-none` is belt-and-braces over the native
   * `disabled` attribute, and it earns its place on touch: without it the
   * button still swallows the tap, so a control that is visibly greyed out
   * eats the gesture meant for whatever sits underneath it. A hit test is the
   * only thing that can tell the two apart — the element is on screen and
   * `toBeVisible` passes either way.
   */
  it('lets a tap fall straight through it while disabled', async ({ buttons }) => {
    const box = boxOf(buttons.locked)
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)

    expect(
      hit,
      'a tap is landing on the disabled button — disabled:pointer-events-none is missing, so it is swallowing gestures meant for what is behind it',
    ).not.toBe(buttons.locked.element())
  })

  /**
   * The press feedback, and the one gotcha in this file that has already been
   * got. Tailwind v4 compiles `scale-[0.97]` to the standalone `scale`
   * property, not to `transform: scale(…)`, so a transition list naming
   * `transform` animates a property that never changes and the press snaps
   * instead of easing. The computed list is the browser's answer to which
   * name won, which is why this is not the class-string assertion it looks
   * like — `transition-[…]` could name anything and still compile.
   */
  it('animates the property its press actually changes', ({ buttons }) => {
    const transitions = getComputedStyle(buttons.save.element()).transitionProperty

    expect(
      transitions,
      'the press transition does not name `scale` — Tailwind compiles scale-[0.97] to the standalone scale property, so a list naming `transform` animates nothing and the press snaps',
    ).toContain('scale')
  })

  /**
   * `[&_svg:not([class*='size-'])]:size-4` sizes any icon the consumer did
   * not size. Lucide ships `width`/`height` of 24 as *attributes*, which the
   * class overrides — so when the selector stops matching, icons do not
   * disappear, they silently render half again too large and every icon
   * button in the app grows. Measuring the rendered box is the only place
   * that shows up.
   */
  it('sizes an icon the consumer did not size', ({ buttons }) => {
    const icon = buttons.back.element().querySelector('svg')
    if (icon === null) throw new Error('no icon inside the icon button')

    expect(
      Math.round(icon.getBoundingClientRect().width),
      "the icon fell back to Lucide's own 24px — the [&_svg:not([class*='size-'])] selector stopped matching",
    ).toBe(16)
  })
})
