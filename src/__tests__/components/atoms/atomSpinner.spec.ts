import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import AtomSpinner from '@/components/atoms/AtomSpinner.vue'
import { i18n } from '@/i18n'
import { it as base } from '../../fixtures'

/**
 * Two claims, and a spinner that fails either is worse than no spinner: one
 * that does not turn reads as a frozen app, and one with no accessible name
 * reads as nothing at all to a screen reader — the state it exists to
 * report is exactly the state it would then fail to report.
 *
 * Both are asserted through what the browser does, not through the classes
 * that ask for it: `getAnimations()` is the live animation, and the role and
 * name are the accessibility tree.
 */

const it = base.extend('spinner', async ({}, { onCleanup }) => {
  const mounted = render(AtomSpinner, { global: { plugins: [i18n] } })
  onCleanup(() => mounted.unmount())

  return {
    status: page.getByRole('status', { name: 'Loading' }),
    get element(): Element {
      const element = document.querySelector('[data-slot="spinner"]')
      if (element === null) throw new Error('spinner not found')
      return element
    },
  }
})

describe('AtomSpinner', () => {
  it('is announced as a busy status with a name from the catalogue', async ({ spinner }) => {
    await expect.element(spinner.status).toBeVisible()
  })

  /**
   * `animate-spin` is a keyframe animation, so the browser is running one or
   * it is not — no transition to settle, no frame to sample. This is what a
   * dropped utility or a `motion-safe:` that never matches looks like from
   * the outside.
   */
  it('is actually turning', ({ spinner }) => {
    expect(
      spinner.element.getAnimations(),
      'the spinner is mounted but no animation is running on it — it reads as a frozen app',
    ).not.toHaveLength(0)
  })
})
