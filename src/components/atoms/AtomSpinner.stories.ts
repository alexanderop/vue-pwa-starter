import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import AtomButton from './AtomButton.vue'
import AtomSpinner from './AtomSpinner.vue'

const meta = {
  title: 'Components/Atoms/Spinner',
  component: AtomSpinner,
  tags: ['autodocs'],
} satisfies Meta<typeof AtomSpinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status', { name: 'Loading' })
    await expect(status).toBeVisible()
    await expect(status.getAnimations()).not.toHaveLength(0)
  },
}
export const ButtonSized: Story = {
  render: () => ({
    components: { AtomButton, AtomSpinner },
    template: '<AtomButton disabled><AtomSpinner />Saving</AtomButton>',
  }),
}
export const LabeledStatus: Story = {
  render: () => ({
    components: { AtomSpinner },
    template:
      '<div class="flex items-center gap-2"><AtomSpinner /><span>Preparing your export</span></div>',
  }),
}
