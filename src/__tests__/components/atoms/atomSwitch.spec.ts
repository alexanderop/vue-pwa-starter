import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import AtomSwitch from '@/components/atoms/AtomSwitch.vue'
import { assertNoViolations } from '../../helpers/a11y'
import { it as base } from '../../fixtures'

/**
 * A switch is the control with the most to get wrong and the least to show
 * for it: it has one piece of state, and every way of reporting that state
 * lives somewhere a jsdom test cannot look.
 *
 * All four oracles are in this one file on purpose. Upstream reka splits them
 * across `Switch.browser.test.ts`, `Switch.aria.browser.test.ts`,
 * `Switch.interactions.browser.test.ts` and a screenshot sheet, because there
 * the component *is* the product and each oracle has its own reviewer. Here a
 * primitive is a means to a screen, and a reader who wants to know what
 * `AtomSwitch` promises should find the answer in one place.
 *
 * What each of them is for:
 *
 * - **axe** grades the rendered markup against the rules a screen sweep would
 *   only reach if some screen happened to mount this control.
 * - **The ARIA snapshot** pins the tree an assistive technology is handed, and
 *   the role-state filter pins that the state is on that node and on no other
 *   — a snapshot alone cannot say "and nowhere else".
 * - **Real input** proves the pointer and the keyboard both reach it.
 * - **Geometry** proves the thumb actually moved, which is the only signal a
 *   sighted user gets and the one no assertion about class names can make.
 */

const Harness = defineComponent({
  setup() {
    const enabled = ref(false)
    return { enabled }
  },
  render() {
    return h('div', [
      h(AtomLabel, { for: 'notifications' }, () => 'Notifications'),
      h(AtomSwitch, {
        id: 'notifications',
        modelValue: this.enabled,
        'onUpdate:modelValue': (value: boolean) => {
          this.enabled = value
        },
      }),
      h(AtomLabel, { for: 'sync' }, () => 'Background sync'),
      h(AtomSwitch, { id: 'sync', disabled: true }),
    ])
  },
})

const it = base.extend('toggle', async ({}, { onCleanup }) => {
  const mounted = render(Harness)
  onCleanup(() => mounted.unmount())

  return {
    container: mounted.container,
    notifications: page.getByRole('switch', { name: 'Notifications' }),
    sync: page.getByRole('switch', { name: 'Background sync' }),
    /**
     * The thumb has no role and no name — it is paint, and the only handle on
     * it is the slot the primitive stamps.
     */
    thumbX(id: string): number {
      const root = document.querySelector(`#${id}`)
      const thumb = root?.querySelector('[data-slot="switch-thumb"]')
      if (thumb === null || thumb === undefined) throw new Error(`no thumb inside #${id}`)
      return thumb.getBoundingClientRect().left
    },
  }
})

describe('AtomSwitch', () => {
  /**
   * The name is the browser-only claim, and it is the reason this component
   * cannot be graded in jsdom at all. reka's `SwitchRoot` derives the missing
   * `aria-label` by finding `[for="<id>"]` and reading its **`innerText`**
   * (`SwitchRoot.vue:91`). `innerText` is defined in terms of layout — jsdom
   * does not implement it, so under jsdom this switch has no accessible name
   * and every `getByRole('switch', { name })` below would have to be
   * rewritten into an attribute check that passes on a nameless control.
   */
  it('is named by the label pointing at it', async ({ toggle }) => {
    await expect.element(toggle.notifications).toHaveAccessibleName('Notifications')
  })

  it('has no accessibility violations', async ({ toggle }) => {
    await assertNoViolations(toggle.container)
  })

  /**
   * Snapshot *and* filter, and they are not redundant. The snapshot says the
   * tree contains a checked switch; the filter says exactly one switch is
   * checked and the other is not. A primitive that writes `aria-checked` onto
   * its thumb as well as its root passes the first and fails the second.
   *
   * Inline rather than a `__snapshots__/` file, unlike the screen trees in
   * `a11y/ariaStructure.spec.ts`: a primitive's tree is four lines, and a
   * reader asking what an assistive technology gets should not have to open a
   * second file to find out.
   */
  it('reports its state on the switch, and on nothing else', async ({ toggle }) => {
    await expect.element(document.body).toMatchAriaInlineSnapshot(`
      - text: Notifications
      - switch "Notifications"
      - text: Background sync
      - switch "Background sync" [disabled]
    `)
    expect(page.getByRole('switch', { checked: true }).elements()).toHaveLength(0)

    await toggle.notifications.click()

    await expect.element(toggle.notifications).toHaveAttribute('aria-checked', 'true')
    expect(page.getByRole('switch', { checked: true }).elements()).toHaveLength(1)
    expect(page.getByRole('switch', { checked: false }).elements()).toHaveLength(1)
  })

  /**
   * `userEvent.tab()` rather than `.focus()`: the contract is that a keyboard
   * user *arrives* at the control, and a programmatic focus call proves only
   * that the element can hold focus, which every element can. Space is the
   * key a switch owes a user — a `<button>` that lost `type="button"` submits
   * the form instead.
   */
  it('toggles from the keyboard', async ({ toggle }) => {
    await userEvent.tab()
    await expect.element(toggle.notifications).toHaveFocus()

    await userEvent.keyboard(' ')

    await expect.element(toggle.notifications).toHaveAttribute('aria-checked', 'true')
  })

  /**
   * The thumb travels on `data-[state=checked]:translate-x-4`, a transform
   * driven by an attribute. A dropped variant, a renamed data attribute or a
   * `transition-transform` that never resolves all leave a switch that reports
   * itself as on while looking off, and no ARIA assertion above can see it.
   * `expect.poll` rather than a wait: the transform is animated, so the claim
   * is that it settles to the right of where it started, not that it is there
   * on the next frame.
   */
  it('moves its thumb across when it turns on', async ({ toggle }) => {
    const off = toggle.thumbX('notifications')

    await toggle.notifications.click()

    await expect
      .poll(() => toggle.thumbX('notifications'), {
        message: 'the switch reports itself as on but its thumb never moved',
      })
      .toBeGreaterThan(off)
  })

  /**
   * A disabled switch that still toggles is the failure that reaches
   * production, because the paint is right and only the behaviour is wrong.
   * A real click is the only thing that proves it: the guard is a `disabled`
   * attribute the browser enforces, not a branch the component runs.
   */
  it('does not toggle while disabled', async ({ toggle }) => {
    await toggle.sync.click({ force: true })

    await expect.element(toggle.sync).toHaveAttribute('aria-checked', 'false')
  })
})
