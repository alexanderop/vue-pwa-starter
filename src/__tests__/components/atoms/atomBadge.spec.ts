import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import AtomBadge from '@/components/atoms/AtomBadge.vue'
import { it as base } from '../../fixtures'

/**
 * The lever a badge has to keep open is ELEMENT. A status marker starts as a
 * `<span>` and, sooner or later, one of them has to become a link — a
 * "3 unsynced" that goes somewhere. `as-child` is what makes that an edit to
 * the call site instead of a `href` prop and a `v-if` inside the primitive,
 * and it is the one part of the component with behaviour to get wrong: the
 * paint has to move onto the consumer's element and the wrapper has to
 * disappear, or the link ends up nested inside a span that carries the
 * styling.
 */

const Harness = defineComponent({
  render: () => [
    h(AtomBadge, { variant: 'secondary' }, () => 'Pinned'),
    h(AtomBadge, { asChild: true }, () => h('a', { href: '#unsynced' }, '3 unsynced')),
  ],
})

const it = base.extend('badges', async ({}, { onCleanup }) => {
  const mounted = render(Harness)
  onCleanup(() => mounted.unmount())

  return {
    pinned: page.getByText('Pinned'),
    link: page.getByRole('link', { name: '3 unsynced' }),
    get painted(): ReadonlyArray<string> {
      return [...document.querySelectorAll('[data-slot="badge"]')].map((element) =>
        element.tagName.toLowerCase(),
      )
    },
  }
})

describe('AtomBadge', () => {
  it('renders its content as plain text, with no role of its own', async ({ badges }) => {
    await expect.element(badges.pinned).toBeVisible()

    // A badge is a label. If it ever acquires a control's role, a screen
    // reader user is told there is something to operate that is not there.
    expect(page.getByRole('button').elements()).toHaveLength(0)
  })

  it('hands its paint to the consumer’s element under as-child', async ({ badges }) => {
    await expect.element(badges.link).toBeVisible()

    expect(
      badges.painted,
      'as-child rendered a wrapper of its own — the anchor should *be* the badge, not sit inside one',
    ).toEqual(['span', 'a'])
  })
})
