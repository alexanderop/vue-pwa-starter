import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import AtomProgress from './AtomProgress.vue'

const meta = {
  title: 'Components/Atoms/Progress',
  component: AtomProgress,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`null` is indeterminate and `0` is "not started" — two different promises, and Reka carries the difference into `aria-valuenow`. The indicator translates rather than animating its width, so a bar in flight never reflows the page.',
      },
    },
  },
} satisfies Meta<typeof AtomProgress>

export default meta
type Story = StoryObj<typeof meta>

export const Determinate: Story = {
  render: () => ({
    components: { AtomProgress },
    template: `
      <div class="mx-auto flex max-w-sm flex-col gap-4">
        <AtomProgress :model-value="0" aria-label="Not started" />
        <AtomProgress :model-value="45" aria-label="Importing notes" />
        <AtomProgress :model-value="100" aria-label="Done" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('progressbar', { name: 'Importing notes' })).toHaveAttribute(
      'aria-valuenow',
      '45',
    )
    // Not started is a value, and it is announced as one.
    await expect(canvas.getByRole('progressbar', { name: 'Not started' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
  },
}

/**
 * Indeterminate. `aria-valuenow` is absent rather than zero, which is the
 * distinction the whole component exists to preserve.
 */
export const Indeterminate: Story = {
  render: () => ({
    components: { AtomProgress },
    template: `<AtomProgress class="mx-auto max-w-sm" :model-value="null" aria-label="Reading your notes" />`,
  }),
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Reading your notes' })

    await expect(bar).not.toHaveAttribute('aria-valuenow')
    await expect(bar).toHaveAttribute('data-state', 'indeterminate')
  },
}
