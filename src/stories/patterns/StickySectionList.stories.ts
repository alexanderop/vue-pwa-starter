import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from 'storybook/test'
import { element } from '../support/dom'
import { MoleculeList, MoleculeListRow, MoleculeListSection } from '@/components/molecules/list'

/**
 * A long list with headings that stick to the top as you scroll past them.
 *
 * The heading tells you where you are in a list too long to see the top of,
 * which is why it is worth the geometry. Three things make it work:
 *
 * - The scroll container is the element with `overflow-y`, and `sticky top-0`
 *   resolves against *its* padding box — not the viewport. A sticky heading
 *   that mysteriously does not stick is almost always sticking to the wrong
 *   scrollport.
 * - `z-(--z-sticky)` puts the heading above the rows it slides over. Without a
 *   layer it is painted in DOM order and the next row covers it.
 * - The heading is opaque. A translucent one over a scrolling list reads as a
 *   rendering bug, and `backdrop-blur` costs a compositor layer per heading.
 *
 * The section wrapper is `MoleculeListSection` — the component this pattern
 * is documenting. The sticky classes go on the heading passed into its slot,
 * which is exactly why that heading is a slot and not a `title` string prop.
 *
 * The headings are real `<h2>`s, so heading navigation jumps between sections
 * — which is the same affordance the sticky behaviour gives a sighted user.
 *
 * The container is `tabindex="0"` because these rows are static: a scrollable
 * box with nothing focusable inside it cannot be scrolled from a keyboard at
 * all, since the arrow keys need something focused to act on. A list of
 * *interactive* rows needs no such thing, and adding it anyway costs a wasted
 * tab stop — `useScrollRegionTabIndex` is the version of this that decides.
 */
const meta = {
  title: 'Patterns/Sticky section list',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sections that stay visible while their rows scroll under them. `sticky` resolves against the scroll container, not the viewport — the most common reason a sticky heading does not stick.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const SECTIONS = [
  { title: 'Today', rows: ['Pack charger', 'Book the ferry', 'Water the plants'] },
  { title: 'Yesterday', rows: ['Call the garage', 'Return the library book'] },
  {
    title: 'Last week',
    rows: ['Renew the pass', 'Quarterly plan', 'Order coffee', 'Fix the gate'],
  },
]

export const Default: Story = {
  render: () => ({
    components: { MoleculeList, MoleculeListRow, MoleculeListSection },
    setup: () => ({ SECTIONS }),
    template: `
      <div
        data-testid="scroller"
        tabindex="0"
        class="mx-auto h-96 max-w-md overflow-y-auto overscroll-contain border focus-ring-inset"
      >
        <MoleculeListSection v-for="section in SECTIONS" :key="section.title" class="gap-0">
          <template #heading>
            <h2
              class="sticky top-0 z-(--z-sticky) border-b bg-background px-gutter py-2 text-caption font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {{ section.title }}
            </h2>
          </template>
          <MoleculeList class="rounded-none border-0 shadow-none">
            <MoleculeListRow v-for="row in section.rows" :key="row">{{ row }}</MoleculeListRow>
          </MoleculeList>
        </MoleculeListSection>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const scroller = element(canvasElement, '[data-testid="scroller"]')

    const first = canvas.getByRole('heading', { name: 'Today', level: 2 })

    await step('every section is a real heading', async () => {
      await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(SECTIONS.length)
    })

    await step('the heading sticks to the scroll container, not the viewport', async () => {
      const before = first.getBoundingClientRect().top

      scroller.scrollTop = 120
      // Within a pixel of the container's own top edge: sub-pixel layout makes
      // an exact equality flaky, and one pixel either way is not the failure
      // this is looking for — that failure is the heading being 120px away.
      await waitFor(() =>
        expect(
          Math.abs(first.getBoundingClientRect().top - scroller.getBoundingClientRect().top),
        ).toBeLessThanOrEqual(1),
      )
      // It did not simply scroll away with its rows.
      await expect(first.getBoundingClientRect().top).toBeGreaterThanOrEqual(before - 1)
    })

    await step('and it is painted above the rows sliding under it', async () => {
      await expect(Number(globalThis.getComputedStyle(first).zIndex)).toBeGreaterThan(0)
      await expect(globalThis.getComputedStyle(first).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    })
  },
}
