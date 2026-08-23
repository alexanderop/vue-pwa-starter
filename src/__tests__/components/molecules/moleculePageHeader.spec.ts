import type { Router } from 'vue-router'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import MoleculePageHeader from '@/components/molecules/MoleculePageHeader.vue'
import { i18n } from '@/i18n'
import { assertNoViolations } from '../../helpers/a11y'
import { it as base } from '../../fixtures'

/**
 * Back is three behaviours wearing one button, and the component picks
 * between them from props: history back by default, `backTo` when the caller
 * knows where back *is* (a deep link has no history to pop), and neither when
 * the parent wants to intercept first — an unsaved-changes guard. Getting the
 * wrong one is not a rendering bug: the button looks identical in all three
 * cases and the user ends up somewhere else.
 *
 * The fourth claim is the long title. A header is a row of fixed-size things
 * around one piece of arbitrary user text, so it is the place where a long
 * note title pushes the actions off the screen.
 */

const Stub = defineComponent({ render: () => h('div', 'stub view') })

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Stub },
      { path: '/notes/1', name: 'note', component: Stub },
      { path: '/settings', name: 'settings', component: Stub },
    ],
  })
}

type HeaderProps = {
  title: string
  subtitle?: string
  backTo?: string
  showBack?: boolean
  preventNavigation?: boolean
}

const it = base.extend('renderHeader', async ({}, { onCleanup }) => {
  let mounted: { unmount: () => Promise<void> } | undefined
  onCleanup(async () => {
    await mounted?.unmount()
  })

  return async (props: HeaderProps, path = '/notes/1') => {
    const router = makeRouter()
    // Two entries deep, so `router.back()` has somewhere to go and a test
    // that asserts it went there is asserting something.
    await router.push('/')
    await router.push(path)
    await router.isReady()

    const screen = render(MoleculePageHeader, {
      props,
      slots: { actions: () => h('button', { type: 'button' }, 'Share') },
      global: { plugins: [i18n, router] },
    })
    mounted = screen

    return { screen, router }
  }
})

const back = page.getByRole('button', { name: 'Go back' })

describe('MoleculePageHeader', () => {
  it('has no accessibility violations', async ({ renderHeader }) => {
    const { screen } = await renderHeader({ title: 'Weekly notes', subtitle: '3 items' })

    await assertNoViolations(screen.container)
  })

  /**
   * The heading is the landmark a screen-reader user navigates the page by,
   * so it has to be a heading rather than styled text — and the back button's
   * name has to come from the catalogue, since an icon-only control has no
   * text to fall back on and would otherwise be announced as "button".
   */
  it('announces the page by its title and the back control by name', async ({ renderHeader }) => {
    await renderHeader({ title: 'Weekly notes' })

    await expect.element(page.getByRole('heading', { name: 'Weekly notes' })).toBeVisible()
    await expect.element(back).toBeVisible()
  })

  it('pops history when no explicit target is given', async ({ renderHeader }) => {
    const { router } = await renderHeader({ title: 'Weekly notes' })

    await back.click()

    await expect.poll(() => router.currentRoute.value.path).toBe('/')
  })

  /**
   * `backTo` exists for the arrival that has no history — a shared link, a
   * notification, a cold start on a deep route. Popping there leaves the app,
   * so the component has to push instead.
   */
  it('pushes the explicit target instead, when it has one', async ({ renderHeader }) => {
    const { router } = await renderHeader({ title: 'Weekly notes', backTo: '/settings' })

    await back.click()

    await expect.poll(() => router.currentRoute.value.path).toBe('/settings')
  })

  /**
   * The guard case. The parent still has to hear about the press — that is
   * how it knows to raise its "discard changes?" prompt — so the event firing
   * and the navigation *not* happening are one claim, not two: a component
   * that swallowed the event entirely would also pass a bare route assertion.
   */
  it('reports the press without navigating when the parent asks to intercept', async ({
    renderHeader,
  }) => {
    const { screen, router } = await renderHeader({
      title: 'Weekly notes',
      preventNavigation: true,
    })

    await back.click()

    expect(screen.emitted('back')).toHaveLength(1)
    expect(
      router.currentRoute.value.path,
      'the header navigated away while the parent was still deciding — an unsaved-changes guard never gets to run',
    ).toBe('/notes/1')
  })

  it('renders no back control on a root-level page', async ({ renderHeader }) => {
    await renderHeader({ title: 'Settings', showBack: false }, '/settings')

    expect(back.elements()).toHaveLength(0)
  })

  /**
   * The layout claim, and the reason it is geometry rather than a class
   * check: `truncate` only works if the flex child it sits on is allowed to
   * shrink. Drop `min-w-0` and the title grows the row instead of clipping,
   * pushing the actions slot past the right edge — where it is still
   * "visible" to every assertion except this one.
   */
  it('clips a long title rather than pushing the actions off screen', async ({ renderHeader }) => {
    await renderHeader({
      title: 'A note title long enough to run past the end of any phone screen',
    })

    await expect.element(page.getByRole('button', { name: 'Share' })).toBeInViewport()
  })
})
