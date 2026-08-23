import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Pin, Trash2 } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { element } from '../../stories/support/dom'
import MoleculeSwipeableRow from './MoleculeSwipeableRow.vue'

const meta = {
  title: 'Components/Molecules/Swipeable row',
  component: MoleculeSwipeableRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A row whose trailing actions are revealed by dragging left. The actions are always in the DOM and always focusable — hidden by being slid off the edge, never by `v-if` — so a keyboard or switch user Tabs straight to them and the row opens to show what they landed on.',
      },
    },
  },
} satisfies Meta<typeof MoleculeSwipeableRow>

export default meta
type Story = StoryObj<typeof meta>

const render = () => ({
  components: { MoleculeSwipeableRow },
  setup: () => ({ Pin, Trash2 }),
  template: `
    <ul class="mx-auto max-w-md list-none divide-y overflow-hidden rounded-lg border p-0">
      <MoleculeSwipeableRow data-testid="row">
        <div class="flex min-h-touch-target items-center px-gutter py-3 text-label">Pack charger</div>
        <template #actions>
          <button type="button" aria-label="Pin note Pack charger" class="flex w-1/2 items-center justify-center bg-secondary text-secondary-foreground">
            <component :is="Pin" class="size-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Delete note Pack charger" class="flex w-1/2 items-center justify-center bg-destructive text-destructive-foreground">
            <component :is="Trash2" class="size-4" aria-hidden="true" />
          </button>
        </template>
      </MoleculeSwipeableRow>
      <MoleculeSwipeableRow>
        <div class="flex min-h-touch-target items-center px-gutter py-3 text-label">Book the ferry</div>
        <template #actions>
          <button type="button" aria-label="Delete note Book the ferry" class="flex w-full items-center justify-center bg-destructive text-destructive-foreground">
            <component :is="Trash2" class="size-4" aria-hidden="true" />
          </button>
        </template>
      </MoleculeSwipeableRow>
    </ul>
  `,
})

/**
 * Closed. Every action is already in the accessibility tree — the row hides
 * them by sliding, so nothing is `display: none` and nothing is conditional.
 */
export const Closed: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const row = canvasElement.querySelector('[data-testid="row"]')

    await expect(row).toHaveAttribute('data-state', 'closed')
    await expect(
      canvas.getByRole('button', { name: 'Delete note Pack charger' }),
    ).toBeInTheDocument()
  },
}

/**
 * The non-gesture path, and the one that matters most.
 *
 * A destructive action reachable only by swiping is unreachable for keyboard
 * and switch users. Tabbing into the actions opens the row, so focus is never
 * sitting on something the user cannot see.
 */
export const KeyboardReachesTheActions: Story = {
  render,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const row = canvasElement.querySelector('[data-testid="row"]')
    const remove = canvas.getByRole('button', { name: 'Delete note Pack charger' })

    await step('Tab reaches the action without any gesture', async () => {
      await userEvent.tab()
      await expect(canvas.getByRole('button', { name: 'Pin note Pack charger' })).toHaveFocus()

      await userEvent.tab()
      await expect(remove).toHaveFocus()
    })

    await step('and the row opens so the focused control is visible', async () => {
      await waitFor(() => expect(row).toHaveAttribute('data-state', 'open'))
    })
  },
}

/**
 * The gesture itself: reveal, commit past the latch point, and cancel short of
 * it. Tagged `touch`, and it asserts the coarse pointer before the branch.
 */
export const SwipeToReveal: Story = {
  tags: ['touch'],
  render,
  play: async ({ canvasElement, step }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const row = element(canvasElement, '[data-testid="row"]')
    const content = element(
      canvasElement,
      '[data-testid="row"] [data-slot="swipeable-row-content"]',
    )

    async function drag(by: number): Promise<void> {
      const box = content!.getBoundingClientRect()
      const y = box.top + box.height / 2

      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: content!, coords: { clientX: box.right - 20, clientY: y } },
        { target: content!, coords: { clientX: box.right - 20 + by / 2, clientY: y } },
        { target: content!, coords: { clientX: box.right - 20 + by, clientY: y } },
        { keys: '[/MouseLeft]' },
      ])
    }

    await step('a short drag springs back', async () => {
      await drag(-20)
      await waitFor(() => expect(row).toHaveAttribute('data-state', 'closed'))
    })

    await step('a drag past the latch point stays open', async () => {
      await drag(-90)
      await waitFor(() => expect(row).toHaveAttribute('data-state', 'open'))
    })

    await step('and dragging back closes it again', async () => {
      await drag(90)
      await waitFor(() => expect(row).toHaveAttribute('data-state', 'closed'))
    })
  },
}
