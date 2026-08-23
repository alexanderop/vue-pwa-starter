import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from 'storybook/test'
import { element } from '../../stories/support/dom'
import { ref } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'
import { PULL_THRESHOLD } from '@/lib/pullToRefresh'
import OrganismPullToRefresh from './OrganismPullToRefresh.vue'

const LABELS = {
  pull: 'Pull down to refresh',
  release: 'Release to refresh',
  refreshing: 'Refreshing your notes',
}

const meta = {
  title: 'Components/Organisms/Pull to refresh',
  component: OrganismPullToRefresh,
  tags: ['autodocs'],
  args: { labels: LABELS, onRefresh: async () => {} },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An accelerator, never the only path to fresh data: it is undiscoverable, unreachable without a touch screen, and impossible to describe to a screen reader. Every story here renders an ordinary Refresh button beside it, and the play functions assert it.',
      },
    },
  },
} satisfies Meta<typeof OrganismPullToRefresh>

export default meta
type Story = StoryObj<typeof meta>

const refreshStory = () => ({
  components: { OrganismPullToRefresh, AtomButton },
  setup() {
    const refreshes = ref(0)

    async function onRefresh(): Promise<void> {
      refreshes.value += 1
    }

    return { onRefresh, refreshes, LABELS }
  },
  template: `
      <div class="flex h-80 flex-col">
        <div class="flex items-center justify-between gap-2 border-b px-gutter py-2">
          <span class="text-caption text-muted-foreground" data-testid="count">Refreshed {{ refreshes }}×</span>
          <AtomButton size="sm" variant="outline" @click="onRefresh">Refresh</AtomButton>
        </div>
        <OrganismPullToRefresh class="flex-1" :labels="LABELS" :on-refresh="onRefresh">
          <ul class="list-none divide-y p-0">
            <li v-for="note in 12" :key="note" class="flex min-h-touch-target items-center px-gutter py-3 text-label">Note {{ note }}</li>
          </ul>
        </OrganismPullToRefresh>
      </div>
    `,
})

/**
 * Idle. Nothing is announced and no indicator is visible — the live region is
 * empty on purpose, because "you could pull this" is not something to say.
 */
export const Idle: Story = {
  render: () => refreshStory(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the gesture is never the only way', async () => {
      // The requirement, asserted rather than reviewed: a refresh a keyboard
      // user can reach. docs/design-system.md.
      await expect(canvas.getByRole('button', { name: 'Refresh' })).toBeVisible()
    })

    await step('nothing is announced at rest', async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('')
    })
  },
}

/**
 * The events, dispatched by hand.
 *
 * `userEvent.pointer` drives a gesture fine when the whole sequence is one
 * call, but a press in one call and a release in the next does not carry — the
 * release simply never arrives. This story has to assert the *middle* of a
 * gesture ("release to refresh", announced while the finger is still down),
 * which needs the press and the release in separate steps, so the events are
 * raw. They are the same four the browser sends.
 */
function pointer(target: Element, type: string, clientY: number, clientX: number): void {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX, clientY }),
  )
}

/**
 * Pulling, ready, and released. Readiness is announced *before* the release:
 * an indicator that only changes once you let go has missed its moment.
 */
export const PullAndRelease: Story = {
  tags: ['touch'],
  render: () => refreshStory(),
  play: async ({ canvasElement, step }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const canvas = within(canvasElement)
    const content = element(canvasElement, '[data-slot="pull-to-refresh-content"]')

    const box = content.getBoundingClientRect()
    const x = box.left + box.width / 2
    const top = box.top + 4

    await step('a short pull says "pull", not "release"', async () => {
      pointer(content, 'pointerdown', top, x)
      pointer(content, 'pointermove', top + 20, x)

      await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(LABELS.pull))
    })

    await step('past the threshold it says "release", before the finger lifts', async () => {
      pointer(content, 'pointermove', top + PULL_THRESHOLD * 4, x)

      await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(LABELS.release))
    })

    await step('releasing refreshes, and the indicator goes back to rest', async () => {
      pointer(content, 'pointerup', top + PULL_THRESHOLD * 4, x)

      await waitFor(() => expect(canvas.getByTestId('count')).toHaveTextContent('Refreshed 1×'))
      await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(''))
    })
  },
}

/**
 * Mid-list, the gesture does not start at all. A pull that begins below the
 * top is somebody scrolling up, and claiming it fires a refresh every time a
 * user reaches the top of a long list.
 */
export const IgnoresAPullFromMidList: Story = {
  tags: ['touch'],
  render: () => refreshStory(),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const canvas = within(canvasElement)
    const content = element(canvasElement, '[data-slot="pull-to-refresh-content"]')

    content.scrollTop = 40
    await waitFor(() => expect(content.scrollTop).toBeGreaterThan(0))

    const box = content.getBoundingClientRect()
    const x = box.left + box.width / 2

    pointer(content, 'pointerdown', box.top + 40, x)
    pointer(content, 'pointermove', box.top + 240, x)
    pointer(content, 'pointerup', box.top + 240, x)

    await expect(canvas.getByRole('status')).toHaveTextContent('')
    await expect(canvas.getByTestId('count')).toHaveTextContent('Refreshed 0×')
  },
}
