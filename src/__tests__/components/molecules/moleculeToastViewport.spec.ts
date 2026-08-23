import { AtomRegistry, registryKey } from '@effect/atom-vue'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import MoleculeToastViewport from '@/components/molecules/MoleculeToastViewport.vue'
import { useToastStore } from '@/stores/toast'
import { it as base } from '../../fixtures'

/**
 * A full-width fixed layer at `z-100`, pinned over the bottom of every screen
 * — which on this app is where the tab bar and the centre FAB live. So the
 * interesting claim is not that it shows a message; it is that it does not
 * eat the taps meant for what is underneath it, at any moment, whether a
 * toast is showing or not.
 *
 * That is the failure this spec exists for, and it is invisible to every
 * other tier: the layer is transparent, so a screenshot shows nothing, axe
 * reports nothing, and the app simply stops responding along the bottom edge.
 * A hit test is the only instrument that sees it.
 */

/** Short enough to wait out in a test, long enough to observe. */
const BRIEF_MS = 150

/** Longer than any test that is not specifically about the timer. */
const LINGERING_MS = 5000

/**
 * Toasts are pushed by clicking, not by reaching into the instance: the store
 * is only reachable from inside a component that has the registry injected,
 * and driving it the way the app does keeps the harness honest about that.
 */
const Harness = defineComponent({
  setup() {
    const toasts = useToastStore()

    return () =>
      h('div', [
        h(
          'button',
          { type: 'button', onClick: () => toasts.showToast('Note saved', LINGERING_MS) },
          'Notify',
        ),
        h(
          'button',
          { type: 'button', onClick: () => toasts.showToast('Backup written', LINGERING_MS) },
          'Notify again',
        ),
        h(
          'button',
          { type: 'button', onClick: () => toasts.showToast('Note saved', BRIEF_MS) },
          'Notify briefly',
        ),
        // Something to be blocked: a control sitting where the layer lies.
        h(
          'button',
          {
            type: 'button',
            style: { position: 'fixed', bottom: '0', left: '0', right: '0', height: '120px' },
          },
          'Underneath',
        ),
        h(MoleculeToastViewport),
      ])
  },
})

const it = base.extend('toasts', async ({}, { onCleanup }) => {
  const mounted = render(Harness, {
    global: {
      provide: {
        // SAFETY: `registryKey` is an InjectionKey<AtomRegistry> — a branded
        // symbol. The assertion strips the phantom type parameter, nothing
        // else. A fresh registry per test is what keeps toasts from one test
        // leaking into the next; see helpers/renderApp.ts.
        [registryKey as symbol]: AtomRegistry.make(),
      },
    },
  })
  onCleanup(() => mounted.unmount())

  return {
    container: mounted.container,
    live: page.getByRole('status'),
    underneath: page.getByRole('button', { name: 'Underneath' }),
    notify: page.getByRole('button', { name: 'Notify' }),
    notifyAgain: page.getByRole('button', { name: 'Notify again' }),
    notifyBriefly: page.getByRole('button', { name: 'Notify briefly' }),
    get region(): HTMLElement {
      const region = document.body.querySelector('[role="status"]')
      if (!(region instanceof HTMLElement)) throw new Error('toast viewport not found')
      return region
    },
  }
})

describe('MoleculeToastViewport', () => {
  /**
   * The layer has to escape whatever the mounting screen is doing with
   * `overflow` and stacking contexts, so it teleports to `<body>`. Asserting
   * it left the mount container is asserting exactly that — a `z-index` on a
   * layer trapped inside a scroll region does nothing at all.
   */
  it('lives on the body, not inside whatever mounted it', ({ toasts }) => {
    expect(document.body.contains(toasts.region)).toBe(true)
    expect(
      toasts.container.contains(toasts.region),
      'the viewport is still inside its mount point — an ancestor with overflow or a stacking context will clip it',
    ).toBe(false)
  })

  /**
   * `aria-live="polite"` on a region that is present from the start is what
   * makes a toast announced *without* moving focus. A live region created at
   * the same moment as its content is not reliably announced at all, which is
   * why the empty region is mounted for the app's lifetime.
   */
  it('announces a message without taking focus', async ({ toasts }) => {
    await toasts.notify.click()
    const before = document.activeElement

    await expect.element(toasts.live).toHaveTextContent('Note saved')
    await expect.element(toasts.live).toHaveAttribute('aria-live', 'polite')
    expect(document.activeElement).toBe(before)
  })

  /**
   * The one that matters. The layer covers the bottom band of the screen at
   * all times, so `pointer-events-none` on it — and `pointer-events-auto` on
   * the toast alone — is the only thing keeping the tab bar tappable.
   * Checked with a toast on screen, because that is the state in which the
   * layer has a child that legitimately *does* take pointer events.
   */
  it('does not swallow taps meant for what is underneath it', async ({ toasts }) => {
    await toasts.notify.click()
    await expect.element(toasts.live).toHaveTextContent('Note saved')

    // A point inside the layer's box but clear of the toast bubble itself.
    const box = toasts.region.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + 8, box.bottom - 8)

    expect(
      toasts.region.contains(hit),
      'a tap in the toast layer is landing on the layer — pointer-events-none is missing, and the whole bottom band of the app has stopped responding',
    ).toBe(false)
    await expect.element(toasts.underneath).toBeVisible()
  })

  /**
   * A toast is ephemeral by definition; one that stays is a banner nobody
   * asked for, permanently covering the bottom of the screen. The store owns
   * the timer, so the observable claim is that the message leaves the live
   * region on its own.
   */
  it('takes itself away again', async ({ toasts }) => {
    await toasts.notifyBriefly.click()

    await expect.element(toasts.live).toHaveTextContent('Note saved')
    await expect.poll(() => toasts.region.textContent?.trim()).toBe('')
  })

  it('stacks messages that arrive together', async ({ toasts }) => {
    await toasts.notify.click()
    await toasts.notifyAgain.click()

    await expect.element(toasts.live).toHaveTextContent('Note saved')
    await expect.element(toasts.live).toHaveTextContent('Backup written')
  })
})
