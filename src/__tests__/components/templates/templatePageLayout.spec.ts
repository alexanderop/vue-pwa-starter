import type { VNode } from 'vue'
import type { Router } from 'vue-router'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import TemplatePageLayout from '@/components/templates/TemplatePageLayout.vue'
import { i18n } from '@/i18n'
import { assertNoViolations } from '../../helpers/a11y'
import { it as base } from '../../fixtures'

/**
 * The template owns one decision and it is a layout one: *which box scrolls*.
 * Getting it wrong is the classic mobile-shell bug — the whole page scrolls
 * instead of the content, so the header slides away, the footer with the
 * primary action slides away with it, and the user is left staring at the
 * middle of a form with no way back out that does not involve scrolling up.
 *
 * Nothing about that is expressible in props or types. It is three boxes and
 * their measured positions after a scroll, which is why this spec is almost
 * entirely geometry.
 */

/** Tall enough that the body cannot fit, short enough to measure quickly. */
const HOST_HEIGHT = 400

const Stub = defineComponent({ render: () => h('div', 'stub view') })

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Stub },
      { path: '/settings', name: 'settings', component: Stub },
    ],
  })
}

/** Mirrors TemplatePageLayout's own `defineSlots`, so a renamed slot fails here too. */
type LayoutSlots = {
  default: () => Array<VNode>
  'header-actions'?: () => VNode
  footer?: () => VNode
}

type LayoutProps = {
  title: string
  subtitle?: string
  showBack?: boolean
  scrollable?: boolean
}

const it = base.extend('renderLayout', async ({}, { onCleanup }) => {
  let mounted: { unmount: () => Promise<void> } | undefined
  onCleanup(async () => {
    await mounted?.unmount()
  })

  return async (props: LayoutProps, withFooter = true) => {
    const router = makeRouter()
    await router.push('/')
    await router.push('/settings')
    await router.isReady()

    // A settings-shaped page: long, and with controls in it. That last part
    // is load-bearing for the axe sweep — a scroll region whose content is
    // entirely read-only trips `scrollable-region-focusable`, because a
    // keyboard user has no way to scroll it. Every page this template
    // currently carries has controls, so the representative harness has them
    // too; see the note on that rule in docs/ui-components.md.
    const slots: LayoutSlots = {
      default: () =>
        Array.from({ length: 40 }, (_, index) =>
          index % 8 === 0
            ? h('button', { type: 'button' }, `row ${index}`)
            : h('p', `row ${index}`),
        ),
      'header-actions': () => h('button', { type: 'button' }, 'Share'),
    }
    // Filled or absent, never present-and-empty: the component branches on
    // `$slots.footer`, so an empty function would exercise the wrong side.
    if (withFooter) slots.footer = () => h('button', { type: 'button' }, 'Save')

    const screen = render(TemplatePageLayout, {
      props,
      slots,
      global: { plugins: [i18n, router] },
    })
    mounted = screen

    // `h-full` needs an ancestor with a height, exactly as in the app, where
    // that is the shell. Without one the template is zero-tall and every
    // measurement below is a measurement of nothing. The mount container is
    // that ancestor here, so it is sized rather than wrapped in a second
    // component.
    screen.container.style.height = `${HOST_HEIGHT}px`

    const region = screen.container.querySelector('.overflow-y-auto, .overflow-hidden')
    if (!(region instanceof HTMLElement)) throw new Error('no content region')

    return { screen, region }
  }
})

const header = page.getByRole('banner')
const save = page.getByRole('button', { name: 'Save' })

describe('TemplatePageLayout', () => {
  it('has no accessibility violations', async ({ renderLayout }) => {
    const { screen } = await renderLayout({ title: 'Settings' })

    await assertNoViolations(screen.container)
  })

  /**
   * The template's own props are the header's props; a reader should be able
   * to check that without reading two files. `Share` proves the slot rename
   * on the way through (`header-actions` outside, `actions` inside) still
   * lands — a renamed slot fails silently, rendering nothing.
   */
  it('passes its page identity and actions through to the header', async ({ renderLayout }) => {
    await renderLayout({ title: 'Settings', subtitle: 'Local only' })

    await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect.element(page.getByText('Local only')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Share' })).toBeVisible()
  })

  /**
   * The claim, stated as the thing the user experiences: after scrolling to
   * the bottom of a long page, both chrome bars are still where they were.
   * If the outer page were the scroller they would have travelled up by the
   * same amount the content did.
   */
  it('scrolls its content while the chrome stays put', async ({ renderLayout }) => {
    const { region } = await renderLayout({ title: 'Settings' })

    expect(
      region.scrollHeight,
      'the content region is not scrolling — 40 rows fit inside 400px, so this is not the box that scrolls',
    ).toBeGreaterThan(region.clientHeight)

    const chromeBefore = header.element().getBoundingClientRect().top
    const footerBefore = save.element().getBoundingClientRect().top

    region.scrollTop = region.scrollHeight

    await expect.poll(() => region.scrollTop).toBeGreaterThan(0)
    expect(header.element().getBoundingClientRect().top).toBe(chromeBefore)
    expect(
      save.element().getBoundingClientRect().top,
      'the footer moved when the content scrolled — the page is scrolling instead of the content region, and the primary action leaves the screen',
    ).toBe(footerBefore)
  })

  /**
   * `scrollable: false` is for a page that manages its own scrolling inside
   * the slot. The region must then clip rather than scroll, or there are two
   * nested scrollers and the gesture goes to whichever one the browser picks.
   */
  it('clips instead of scrolling when the page owns its own scrolling', async ({
    renderLayout,
  }) => {
    const { region } = await renderLayout({ title: 'Settings', scrollable: false })

    expect(getComputedStyle(region).overflowY).toBe('hidden')
  })

  /**
   * `overscroll-contain`, and the reason it is not cosmetic: this scroller is
   * nested inside the shell's. Without it, reaching the end of a settings
   * list chains the gesture outwards and the whole app shell starts moving —
   * on iOS, the rubber-band that looks like the page came unstuck.
   */
  it('keeps an overscroll gesture from chaining out to the shell', async ({ renderLayout }) => {
    const { region } = await renderLayout({ title: 'Settings' })

    expect(getComputedStyle(region).overscrollBehaviorY).toBe('contain')
  })

  it('renders no footer when the page has no footer to show', async ({ renderLayout }) => {
    await renderLayout({ title: 'Settings' }, false)

    expect(page.getByRole('contentinfo').elements()).toHaveLength(0)
  })
})
