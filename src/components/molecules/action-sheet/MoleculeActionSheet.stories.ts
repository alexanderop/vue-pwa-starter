import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Pin, Share, Trash2 } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { MoleculeActionSheet, MoleculeActionSheetItem } from '.'

const subcomponents = { MoleculeActionSheetItem }

const meta = {
  title: 'Components/Molecules/Action sheet',
  component: MoleculeActionSheet,
  subcomponents,
  tags: ['autodocs'],
  args: { title: 'Pack charger' },
  parameters: {
    docs: {
      description: {
        component:
          'The native overflow affordance. A dropdown anchored to a 24px "⋯" puts a list of 32px rows under a thumb; the same choices as full-width rows at the bottom edge are reachable one-handed. Built on `MoleculeSheet`, so the swipe, the scrim and the focus restore come for free.',
      },
    },
  },
} satisfies Meta<typeof MoleculeActionSheet>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeActionSheet, ...subcomponents }

const render = () => ({
  components,
  setup: () => ({ Pin, Share, Trash2 }),
  template: `
    <MoleculeActionSheet :open="true" title="Pack charger">
      <template #description>Edited 2 minutes ago</template>

      <MoleculeActionSheetItem>
        <template #icon><component :is="Pin" class="size-5" aria-hidden="true" /></template>
        Pin to the top
      </MoleculeActionSheetItem>
      <MoleculeActionSheetItem>
        <template #icon><component :is="Share" class="size-5" aria-hidden="true" /></template>
        Share a copy
      </MoleculeActionSheetItem>
      <MoleculeActionSheetItem destructive>
        <template #icon><component :is="Trash2" class="size-5" aria-hidden="true" /></template>
        Delete note
      </MoleculeActionSheetItem>

      <template #cancel>
        <MoleculeActionSheetItem class="justify-center font-medium">Cancel</MoleculeActionSheetItem>
      </template>
    </MoleculeActionSheet>
  `,
})

export const Open: Story = {
  render,
  play: async ({ canvasElement, step }) => {
    const body = within(canvasElement.ownerDocument.body)

    await step('the actions are a list of real buttons', async () => {
      // The first list is the actions; the second is the cancel row, which is
      // deliberately its own group rather than a fourth action.
      const [actions, dismissal] = body.getAllByRole('list')
      if (actions === undefined || dismissal === undefined) {
        throw new Error('the action sheet renders two lists: the actions and the cancel row')
      }

      await expect(within(actions).getAllByRole('listitem')).toHaveLength(3)
      await expect(within(dismissal).getAllByRole('listitem')).toHaveLength(1)
      await expect(body.getByRole('button', { name: 'Pin to the top' })).toBeVisible()
    })

    await step('the destructive one is marked, not just coloured', async () => {
      const remove = body.getByRole('button', { name: 'Delete note' })
      await expect(remove).toHaveAttribute('data-destructive')
      // And it reads as destructive, so a reviewer cannot miss it either.
      await expect(globalThis.getComputedStyle(remove).color).not.toBe(
        globalThis.getComputedStyle(body.getByRole('button', { name: 'Share a copy' })).color,
      )
    })

    await step('cancel is separated from the actions', async () => {
      const cancel = body.getByRole('button', { name: 'Cancel' })
      await expect(cancel).toBeVisible()
      await expect(
        canvasElement.ownerDocument.querySelector('[data-slot="action-sheet-cancel"]'),
      ).not.toBeNull()
    })
  },
}

/** Every row clears the 44px floor — that is the point of the shape. */
export const TouchTargetContract: Story = {
  tags: ['touch'],
  render,
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const body = within(canvasElement.ownerDocument.body)

    for (const name of ['Pin to the top', 'Share a copy', 'Delete note', 'Cancel']) {
      await expect(
        body.getByRole('button', { name }).getBoundingClientRect().height,
      ).toBeGreaterThanOrEqual(44)
    }
  },
}

/** Escape closes it, so the sheet is never a trap. */
export const Dismissal: Story = {
  render,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)

    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}
