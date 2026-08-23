import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import AtomSkeleton from '@/components/atoms/AtomSkeleton.vue'
import { it as base } from '../../fixtures'

/**
 * A skeleton's whole job is to hold the space the real content will take, so
 * the consumer's sizing reaching the element *is* the behaviour — if `cn()`
 * dropped `props.class`, or a default height fought it, the placeholder would
 * be the wrong size and the list would jump exactly when the data lands.
 * Measuring the box says that; reading the class attribute would not.
 */

/** The height the harness asks for, in px — `h-24` is 6rem at the 16px root. */
const REQUESTED_HEIGHT = 96

const it = base.extend('skeleton', async ({}, { onCleanup }) => {
  const mounted = render(AtomSkeleton, { props: { class: 'h-24 w-full' } })
  onCleanup(() => mounted.unmount())

  const element = document.querySelector('[data-slot="skeleton"]')
  if (!(element instanceof HTMLElement)) throw new Error('skeleton not found')
  return element
})

describe('AtomSkeleton', () => {
  it('holds the space the consumer sized it to', ({ skeleton }) => {
    expect(
      Math.round(skeleton.getBoundingClientRect().height),
      "the consumer's height did not reach the element — cn() is dropping props.class, or a default is winning the merge",
    ).toBe(REQUESTED_HEIGHT)
  })

  it('is pulsing', ({ skeleton }) => {
    expect(
      skeleton.getAnimations(),
      'a placeholder that does not pulse is indistinguishable from content that arrived empty',
    ).not.toHaveLength(0)
  })

  /**
   * The attribute rather than a rendered assertion, for the same reason the
   * arch tier asserts `data-slot`: it is the contract, and there is nothing
   * else to observe — an empty grey box exposes no name, no role and no text
   * for a query to find either way. What this catches is the attribute being
   * dropped, which would put eight announcements of nothing into a list.
   */
  it('stays out of the accessibility tree', ({ skeleton }) => {
    expect(skeleton.getAttribute('aria-hidden')).toBe('true')
  })
})
